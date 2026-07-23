import { amplitudeToDbfs, peak, rms } from "../audio/levelAnalysis";
import { centsBetween, centsFromNearestNote } from "../pitch/conversion/cents";
import { frequencyToMidi, nearestMidi } from "../pitch/conversion/frequencyToMidi";
import { midiToNoteName } from "../pitch/conversion/midiToNote";
import { SwiftF0Detector, SWIFT_F0_HOP_SIZE, SWIFT_F0_WINDOW_SIZE } from "../pitch/detectors/SwiftF0Detector";
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
let swiftBuffer: Float32Array<ArrayBufferLike> = new Float32Array(0);
let swiftBufferStartTimestamp = 0;
let lastSwiftTimestamp = -Infinity;

const detector = new YinDetector();
const swiftDetector = new SwiftF0Detector();
const voicing = new VoicingEstimator();
let medianFilter = new MedianPitchFilter(config.medianWindowFrames);
const tracker = new CandidateTracker();
let messageQueue = Promise.resolve();

const post = (message: PitchWorkerResponse) => self.postMessage(message);

self.onmessage = (event: MessageEvent<PitchWorkerRequest>) => {
  const message = event.data;
  messageQueue = messageQueue.then(() => handleMessage(message)).catch((error) => {
    post({ type: "error", sessionId, message: error instanceof Error ? error.message : "Pitch worker failed" });
  });
};

const handleMessage = async (message: PitchWorkerRequest): Promise<void> => {
  if (message.type === "configure") {
    sessionId = message.sessionId;
    config = message.config;
    medianFilter = new MedianPitchFilter(config.medianWindowFrames);
    resetState();
    post({ type: "detector-status", sessionId, status: config.detectorKind === "swift-f0" ? "loading" : "ready" });
    if (config.detectorKind === "swift-f0") await swiftDetector.load();
    post({ type: "ready", sessionId });
    post({ type: "detector-status", sessionId, status: "ready" });
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
  if (message.type === "samples") await processSamples(message.samples, message.sampleRate, message.timestamp);
};

const resetState = () => {
  resampled = new Float32Array(0);
  lastSourceRemainder = new Float32Array(0);
  swiftBuffer = new Float32Array(0);
  swiftBufferStartTimestamp = 0;
  lastSwiftTimestamp = -Infinity;
  voicing.reset();
  medianFilter.reset();
  tracker.reset();
  swiftDetector.reset();
};

const processSamples = async (samples: Float32Array, inputSampleRate: number, timestamp: number) => {
  config = { ...config, inputSampleRate };
  const next = resampleTo16k(samples, inputSampleRate, config.analysisSampleRate);
  if (config.detectorKind === "swift-f0") {
    await processSwiftSamples(next, timestamp);
    return;
  }

  resampled = append(resampled, next);
  while (resampled.length >= config.frameSize) {
    const frame = resampled.slice(0, config.frameSize);
    const levelRms = rms(frame);
    const levelPeak = peak(frame);
    const detection = detector.detect(removeDc(frame), config);
    emitPitchFrame(detection, levelRms, levelPeak, timestamp - resampled.length / config.analysisSampleRate);
    resampled = resampled.slice(config.hopSize);
  }
};

const processSwiftSamples = async (samples: Float32Array<ArrayBufferLike>, timestamp: number) => {
  if (samples.length === 0) return;
  if (swiftBuffer.length === 0) swiftBufferStartTimestamp = timestamp - samples.length / config.analysisSampleRate;
  swiftBuffer = append(swiftBuffer, samples);

  const inferenceStep = SWIFT_F0_WINDOW_SIZE / 2;
  while (swiftBuffer.length >= SWIFT_F0_WINDOW_SIZE) {
    const window = swiftBuffer.slice(0, SWIFT_F0_WINDOW_SIZE);
    const detections = await swiftDetector.detect(window, config);
    detections.forEach((detection, index) => {
      const frameTimestamp = swiftBufferStartTimestamp + (index * SWIFT_F0_HOP_SIZE + 127.5) / config.analysisSampleRate;
      if (frameTimestamp <= lastSwiftTimestamp) return;
      lastSwiftTimestamp = frameTimestamp;
      const frameSamples = window.slice(index * SWIFT_F0_HOP_SIZE, index * SWIFT_F0_HOP_SIZE + config.frameSize);
      emitPitchFrame(detection, rms(frameSamples), peak(frameSamples), frameTimestamp);
    });
    swiftBuffer = swiftBuffer.slice(inferenceStep);
    swiftBufferStartTimestamp += inferenceStep / config.analysisSampleRate;
  }
};

const emitPitchFrame = (detection: { frequencyHz: number | null; confidence: number; candidates: PitchFrame["candidates"] }, frameRms: number, framePeak: number, timestamp: number) => {
  const trackedFrequency = tracker.accept(detection.frequencyHz);
  const smoothedFrequency = medianFilter.push(trackedFrequency);
  const bestCandidate = detection.candidates?.[0] ?? null;
  const rmsDbfs = amplitudeToDbfs(frameRms);
  const clipped = framePeak >= 0.985;
  const voiced = voicing.estimate(bestCandidate, detection.confidence, rmsDbfs, clipped, {
    confidenceThreshold: config.confidenceThreshold,
    voicedExitThreshold: config.voicedExitThreshold,
    minRmsDbfs: -60,
    minFrequencyHz: config.minFrequencyHz,
    maxFrequencyHz: config.maxFrequencyHz
  });
  const frequencyHz = voiced.voiced ? smoothedFrequency : null;
  const pitchFrame: PitchFrame = {
    sessionId,
    timestamp,
    frequencyHz,
    midi: frequencyHz === null ? null : frequencyToMidi(frequencyHz),
    noteName: frequencyHz === null ? null : midiToNoteName(nearestMidi(frequencyHz)),
    targetMidi,
    centsFromTarget: frequencyHz !== null && targetFrequencyHz !== null ? centsBetween(frequencyHz, targetFrequencyHz) : null,
    centsFromNearestNote: frequencyHz === null ? null : centsFromNearestNote(frequencyHz),
    confidence: detection.confidence,
    voicedProbability: voiced.probability,
    voiced: voiced.voiced,
    candidates: detection.candidates?.slice(0, 3),
    rmsDbfs,
    clipped
  };
  post({ type: "pitch-frame", sessionId, frame: pitchFrame });
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
