import type { LevelFrame } from "../types/audio";
import type { MicrophoneStatus } from "../types/session";

export const hasMicrophonePermission = (status: MicrophoneStatus): boolean =>
  status === "granted" || status === "ready" || status === "too-quiet" || status === "clipping";

export const canStartExercise = (status: MicrophoneStatus, _calibrated: boolean, _level: LevelFrame | null, deviceId: string): boolean =>
  hasMicrophonePermission(status) && Boolean(deviceId);
