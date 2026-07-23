import type { LevelFrame } from "../types/audio";
import type { PitchDetectorKind, PitchDetectorStatus, PitchFrame } from "../types/pitch";
import { getAudioContextCtor } from "../utils/featureDetection";
import { DEFAULT_DETECTOR_CONFIG, type PitchWorkerResponse } from "../workers/workerProtocol";
import type { WorkletMessage } from "../audio-worklet/worklet-messages";
import { GuideToneScheduler } from "./GuideToneScheduler";

interface AudioEngineOptions {
  onLevel: (level: LevelFrame) => void;
  onPitchFrame: (frame: PitchFrame) => void;
  onDetectorStatus: (status: PitchDetectorStatus) => void;
  onError: (message: string) => void;
}

export class AudioEngine {
  audioContext: AudioContext | null = null;
  guideToneScheduler: GuideToneScheduler | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private worker: Worker | null = null;
  private sessionId = "";

  constructor(private readonly options: AudioEngineOptions) {}

  async initialize(stream: MediaStream, sessionId: string, detectorKind: PitchDetectorKind = "yin"): Promise<void> {
    await this.cleanup(false);
    this.sessionId = sessionId;
    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor) throw new Error("AudioContext is not supported in this browser.");
    this.audioContext = new AudioContextCtor({ latencyHint: "interactive" });
    if (!this.audioContext.audioWorklet) throw new Error("AudioWorklet is not supported in this browser.");
    await this.audioContext.audioWorklet.addModule(new URL("../audio-worklet/microphone-processor.js", import.meta.url));
    this.worker = new Worker(new URL("../workers/pitch.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (event: MessageEvent<PitchWorkerResponse>) => {
      const message = event.data;
      if (message.sessionId !== this.sessionId) return;
      if (message.type === "pitch-frame") this.options.onPitchFrame(message.frame);
      if (message.type === "detector-status") this.options.onDetectorStatus(message.status);
      if (message.type === "error") this.options.onError(message.message);
    };
    this.worker.postMessage({
      type: "configure",
      sessionId,
      config: { ...DEFAULT_DETECTOR_CONFIG, detectorKind, inputSampleRate: this.audioContext.sampleRate }
    });
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.workletNode = new AudioWorkletNode(this.audioContext, "microphone-processor", {
      processorOptions: { sessionId, batchSize: 2048 }
    });
    this.workletNode.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
      const message = event.data;
      if (message.sessionId !== this.sessionId) return;
      if (message.type === "level") this.options.onLevel(message);
      if (message.type === "samples") {
        this.worker?.postMessage(
          { type: "samples", sessionId, timestamp: message.timestamp, sampleRate: this.audioContext?.sampleRate ?? 48000, samples: message.samples },
          [message.samples.buffer]
        );
      }
    };
    this.source.connect(this.workletNode);
    this.workletNode.connect(this.audioContext.destination);
    this.guideToneScheduler = new GuideToneScheduler(this.audioContext);
  }

  async resume(): Promise<void> {
    if (this.audioContext?.state === "suspended") await this.audioContext.resume();
  }

  setTarget(targetMidi: number | null, targetFrequencyHz: number | null): void {
    this.worker?.postMessage({ type: "target", sessionId: this.sessionId, targetMidi, targetFrequencyHz });
  }

  setDetector(detectorKind: PitchDetectorKind): void {
    if (!this.worker || !this.audioContext) return;
    this.options.onDetectorStatus(detectorKind === "swift-f0" ? "loading" : "ready");
    this.worker.postMessage({
      type: "configure",
      sessionId: this.sessionId,
      config: { ...DEFAULT_DETECTOR_CONFIG, detectorKind, inputSampleRate: this.audioContext.sampleRate }
    });
  }

  async cleanup(closeContext = true): Promise<void> {
    this.guideToneScheduler?.stop();
    this.workletNode?.disconnect();
    this.source?.disconnect();
    this.worker?.terminate();
    if (closeContext && this.audioContext && this.audioContext.state !== "closed") await this.audioContext.close();
    this.guideToneScheduler = null;
    this.workletNode = null;
    this.source = null;
    this.worker = null;
    this.audioContext = null;
  }
}
