import { nearestMidi } from "../pitch/conversion/frequencyToMidi";
import type { PitchFrame } from "../types/pitch";

export type FrameClassification = "unvoiced" | "correct-note" | "wrong-note" | "wrong-octave";

export const classifyFrame = (frame: PitchFrame, targetMidi: number, confidenceThreshold = 0.72): FrameClassification => {
  if (!frame.voiced || frame.frequencyHz === null || frame.confidence < confidenceThreshold || frame.clipped) return "unvoiced";
  const detectedMidi = nearestMidi(frame.frequencyHz);
  const diff = detectedMidi - targetMidi;
  if (diff === 0) return "correct-note";
  if (Math.abs(diff) === 12) return "wrong-octave";
  return "wrong-note";
};
