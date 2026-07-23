import type { TargetNote } from "./exercise";

export interface NoteScore {
  stepIndex: number;
  targetNote: TargetNote;
  score: number | null;
  pitchAccuracy: number | null;
  stability: number | null;
  voicedCoverage: number;
  octaveScore: number | null;
  holdDurationScore: number;
  medianCents: number | null;
  meanAbsoluteCents: number | null;
  predominantDirection: "flat" | "centred" | "sharp" | "unknown";
  wrongNoteRatio: number;
  wrongOctaveRatio: number;
  sufficientData: boolean;
}

export interface SessionResult {
  sessionId: string;
  overallScore: number;
  completedNotes: number;
  totalNotes: number;
  averageAbsoluteCents: number | null;
  voicedCoverage: number;
  stabilityScore: number | null;
  noteScores: NoteScore[];
  bestNoteIndex: number | null;
  difficultNoteIndex: number | null;
  predominantDirection: "flat" | "centred" | "sharp" | "mixed";
}
