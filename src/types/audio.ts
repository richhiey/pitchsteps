export interface LevelFrame {
  sessionId: string;
  timestamp: number;
  rms: number;
  peak: number;
  rmsDbfs: number;
  clipped: boolean;
}

export interface AudioFeatures {
  mediaDevices: boolean;
  getUserMedia: boolean;
  enumerateDevices: boolean;
  audioContext: boolean;
  audioWorklet: boolean;
  worker: boolean;
  sharedArrayBuffer: boolean;
  deviceChange: boolean;
  reducedMotion: boolean;
  secureContext: boolean;
}
