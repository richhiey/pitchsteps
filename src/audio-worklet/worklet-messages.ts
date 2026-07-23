export interface MicrophoneProcessorOptions {
  sessionId: string;
  batchSize: number;
}

export type WorkletMessage =
  | { type: "level"; sessionId: string; timestamp: number; rms: number; peak: number; rmsDbfs: number; clipped: boolean }
  | { type: "samples"; sessionId: string; timestamp: number; samples: Float32Array };
