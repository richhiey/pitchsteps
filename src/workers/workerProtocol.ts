import type { DetectorConfiguration, PitchFrame } from "../types/pitch";

export type PitchWorkerRequest =
  | { type: "configure"; sessionId: string; config: DetectorConfiguration }
  | { type: "samples"; sessionId: string; timestamp: number; sampleRate: number; samples: Float32Array }
  | { type: "target"; sessionId: string; targetMidi: number | null; targetFrequencyHz: number | null }
  | { type: "reset"; sessionId: string };

export type PitchWorkerResponse =
  | { type: "ready"; sessionId: string }
  | { type: "pitch-frame"; sessionId: string; frame: PitchFrame }
  | { type: "error"; sessionId: string; message: string };

export const DEFAULT_DETECTOR_CONFIG: DetectorConfiguration = {
  inputSampleRate: 48000,
  analysisSampleRate: 16000,
  frameSize: 1024,
  hopSize: 160,
  minFrequencyHz: 80,
  maxFrequencyHz: 1000,
  yinThreshold: 0.12,
  confidenceThreshold: 0.72,
  voicedExitThreshold: 0.6,
  medianWindowFrames: 5,
  displaySmoothingAlpha: 0.35
};
