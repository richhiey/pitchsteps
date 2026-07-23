export interface PitchCandidate {
  frequencyHz: number;
  periodSamples: number;
  probability: number;
  yinValue: number;
}

export type PitchDetectorKind = "yin" | "swift-f0";

export type PitchDetectorStatus = "idle" | "loading" | "ready" | "error";

export interface PitchFrame {
  sessionId: string;
  timestamp: number;
  frequencyHz: number | null;
  midi: number | null;
  noteName: string | null;
  targetMidi: number | null;
  centsFromTarget: number | null;
  centsFromNearestNote: number | null;
  confidence: number;
  voicedProbability: number;
  voiced: boolean;
  candidates?: PitchCandidate[];
  rmsDbfs: number;
  clipped: boolean;
}

export interface DetectorConfiguration {
  detectorKind: PitchDetectorKind;
  inputSampleRate: number;
  analysisSampleRate: number;
  frameSize: number;
  hopSize: number;
  minFrequencyHz: number;
  maxFrequencyHz: number;
  yinThreshold: number;
  confidenceThreshold: number;
  voicedExitThreshold: number;
  medianWindowFrames: number;
  displaySmoothingAlpha: number;
}

export interface VoicingResult {
  voiced: boolean;
  probability: number;
  signalPresent: boolean;
  reason: "voiced" | "low-level" | "no-candidate" | "low-confidence" | "clipping" | "out-of-range";
}

export interface InterpretedPitchFrame extends PitchFrame {
  feedback: "listening" | "flat" | "in-tune" | "sharp" | "wrong-note" | "wrong-octave";
  instruction: string;
  displayCents: number | null;
}
