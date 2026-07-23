import { amplitudeToDbfs, peak, rms } from "../audio/levelAnalysis";
import { centsBetween, centsFromNearestNote } from "../pitch/conversion/cents";
import { frequencyToMidi, nearestMidi } from "../pitch/conversion/frequencyToMidi";
import { midiToNoteName } from "../pitch/conversion/midiToNote";
import { YinDetector } from "../pitch/detectors/YinDetector";
import { CandidateTracker } from "../pitch/smoothing/CandidateTracker";
import { MedianPitchFilter } from "../pitch/smoothing/MedianPitchFilter";
import { VoicingEstimator } from "../pitch/voicing/VoicingEstimator";
import type { DetectorConfiguration, PitchFrame } from "../types/pitch";
import { DEFAULT_DETECTOR_CONFIG, type PitchWorkerRequest, type PitchWorkerResponse } from "./workerProtocol";

let sessionId = "";
let config: DetectorConfiguration = DEFAULT_DETECTOR_CONFIG;
let targetMidi: number | null = null;
let targetFrequencyHz: number | null = null;
let resampled: Float32Array<ArrayBufferLike> = new Float32Array(0);
let lastSourceRemainder: Float32Array<ArrayBufferLike> = new Float32Array(0);

const detector = new YinDetector();
const voicing = new VoicingEstimator();
let medianFilter = new MedianPitchFilter(config.medianWindowFrames);
const tracker = new CandidateTracker();

const post = (message: PitchWorkerResponse) => self.postMessage(message);

self.onmessage = (event: MessageEvent<PitchWorkerRequest>) => {
  try {
    const message = event.data;
    if (message.type === "configure") {
      sessionId = message.sessionId;
      config = message.config;
      medianFilter = new MedianPitchFilter(config.medianWindowFrames);
      resetState();
      post({ type: "ready", sessionId });
      return;
    }
    if (message.sessionId !== sessionId) return;
    if (message.type === "target") {
      targetMidi = message.targetMidi;
      targetFrequencyHz = message.targetFrequencyHz;
      tracker.reset();
      medianFilter.reset();
      return;
    }
    if (message.type === "reset") {
      resetState();
      return;
    }
    if (message.type === "samples") processSamples(message.samples, message.sampleRate, message.timestamp);
  } catch (error) {
    post({ type: "error", sessionId, message: error instanceof Error ? error.message : "Pitch worker failed" });
  }
};

const resetState = () => {
  resampled = new Float32Array(0);
  lastSourceRemainder = new Float32Array(0);
  voicing.reset();
  medianFilter.reset();
  tracker.reset();
};

const processSamples = (samples: Float32Array, inputSampleRate: number, timestamp: number) => {
  config = { ...config, inputSampleRate };
  const next = resampleTo16k(samples, inputSampleRate, config.analysisSampleRate);
  resampled = append(resampled, next);
  while (resampled.length >= config.frameSize) {
    const frame = resampled.slice(0, config.frameSize);
    const levelRms = rms(frame);
    const levelPeak = peak(frame);
    const rmsDbfs = amplitudeToDbfs(levelRms);
    const detection = detector.detect(removeDc(frame), config);
    const trackedFrequency = tracker.accept(detection.frequencyHz);
    const smoothedFrequency = medianFilter.push(trackedFrequency);
    const bestCandidate = detection.candidates[0] ?? null;
    const voiced = voicing.estimate(bestCandidate, detection.confidence, rmsDbfs, levelPeak >= 0.985, {
      confidenceThreshold: config.confidenceThreshold,
      voicedExitThreshold: config.voicedExitThreshold,
      minRmsDbfs: -60,
      minFrequencyHz: config.minFrequencyHz,
      maxFrequencyHz: config.maxFrequencyHz
    });
    const frequencyHz = voiced.voiced ? smoothedFrequency : null;
    const frameTimestamp = timestamp - resampled.length / config.analysisSampleRate;
    const pitchFrame: PitchFrame = {
      sessionId,
      timestamp: frameTimestamp,
      frequencyHz,
      midi: frequencyHz === null ? null : frequencyToMidi(frequencyHz),
      noteName: frequencyHz === null ? null : midiToNoteName(nearestMidi(frequencyHz)),
      targetMidi,
      centsFromTarget: frequencyHz !== null && targetFrequencyHz !== null ? centsBetween(frequencyHz, targetFrequencyHz) : null,
      centsFromNearestNote: frequencyHz === null ? null : centsFromNearestNote(frequencyHz),
      confidence: detection.confidence,
      voicedProbability: voiced.probability,
      voiced: voiced.voiced,
      candidates: detection.candidates.slice(0, 3),
      rmsDbfs,
      clipped: levelPeak >= 0.985
    };
    post({ type: "pitch-frame", sessionId, frame: pitchFrame });
    resampled = resampled.slice(config.hopSize);
  }
};

const append = (left: Float32Array<ArrayBufferLike>, right: Float32Array<ArrayBufferLike>): Float32Array<ArrayBufferLike> => {
  const output = new Float32Array(left.length + right.length);
  output.set(left);
  output.set(right, left.length);
  return output;
};

const removeDc = (samples: Float32Array): Float32Array => {
  let sampleMean = 0;
  for (const sample of samples) sampleMean += sample;
  sampleMean /= samples.length;
  const output = new Float32Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) output[index] = samples[index] - sampleMean;
  return output;
};

const resampleTo16k = (samples: Float32Array<ArrayBufferLike>, inputRate: number, outputRate: number): Float32Array<ArrayBufferLike> => {
  const combined = append(lastSourceRemainder, samples);
  if (inputRate === outputRate) {
    lastSourceRemainder = new Float32Array(0);
    return combined;
  }
  const ratio = inputRate / outputRate;
  const outputLength = Math.floor((combined.length - 1) / ratio);
  const output = new Float32Array(Math.max(0, outputLength));
  for (let index = 0; index < output.length; index += 1) {
    const sourceIndex = index * ratio;
    const left = Math.floor(sourceIndex);
    const frac = sourceIndex - left;
    output[index] = combined[left] * (1 - frac) + combined[Math.min(left + 1, combined.length - 1)] * frac;
  }
  const consumed = Math.floor(output.length * ratio);
  lastSourceRemainder = combined.slice(consumed);
  return output;
};
