import type { LevelFrame } from "../types/audio";

export const canStartExercise = (status: string, calibrated: boolean, level: LevelFrame | null, deviceId: string): boolean =>
  status === "ready" && calibrated && Boolean(level) && !level?.clipped && Boolean(deviceId);
