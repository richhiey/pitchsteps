import { clamp } from "../utils/math";

export type PitchFeedbackState = "listening" | "flat" | "in-tune" | "sharp" | "wrong-note" | "wrong-octave";

export interface PitchLaneModel {
  markerX: number;
  markerOpacity: number;
  label: string;
  state: PitchFeedbackState;
}

export const buildPitchLaneModel = (cents: number | null, state: PitchFeedbackState): PitchLaneModel => {
  const clamped = cents === null ? 0 : clamp(cents, -100, 100);
  return {
    markerX: 50 + clamped / 2,
    markerOpacity: cents === null || state === "listening" ? 0.35 : 1,
    label: cents === null ? "Listening" : `${Math.round(cents)} cents`,
    state
  };
};

export const interpretFeedback = (
  voiced: boolean,
  confidence: number,
  cents: number | null,
  detectedMidi: number | null,
  targetMidi: number | null,
  previousState: PitchFeedbackState = "listening"
): { state: PitchFeedbackState; instruction: string } => {
  if (!voiced || confidence < 0.6 || cents === null) return { state: "listening", instruction: "Sing the note" };
  if (detectedMidi !== null && targetMidi !== null) {
    const diff = detectedMidi - targetMidi;
    if (Math.abs(diff) === 12) return { state: "wrong-octave", instruction: "Same note, different octave" };
    if (diff !== 0 && Math.abs(diff) <= 2) return { state: "wrong-note", instruction: "Move to the target note" };
  }

  const inTuneLimit = previousState === "in-tune" ? 24 : 18;
  if (Math.abs(cents) <= inTuneLimit) return { state: "in-tune", instruction: "Hold it" };
  if (cents < -50) return { state: "flat", instruction: "Higher" };
  if (cents < -20) return { state: "flat", instruction: "A little higher" };
  if (cents > 50) return { state: "sharp", instruction: "Lower" };
  return { state: "sharp", instruction: "A little lower" };
};
