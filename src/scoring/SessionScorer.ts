import type { ExerciseDefinition } from "../types/exercise";
import type { PitchFrame } from "../types/pitch";
import type { SessionResult } from "../types/scoring";
import { mean } from "../utils/math";
import { scoreNote } from "./NoteScorer";

export const scoreSession = (sessionId: string, definition: ExerciseDefinition, frames: PitchFrame[]): SessionResult => {
  const noteScores = definition.steps.map((step) => scoreNote(step, frames));
  const valid = noteScores.filter((note) => note.score !== null);
  const scores = valid.map((note) => note.score as number);
  const overallScore = Math.round(mean(scores) ?? 0);
  const best = valid.reduce((bestNote, note) => ((note.score ?? -1) > (bestNote?.score ?? -1) ? note : bestNote), valid[0] ?? null);
  const difficult = valid.reduce((worstNote, note) => ((note.score ?? 101) < (worstNote?.score ?? 101) ? note : worstNote), valid[0] ?? null);
  const directions = valid.map((note) => note.predominantDirection).filter((direction) => direction !== "unknown");
  const predominantDirection = directions.length === 0 || new Set(directions).size > 1 ? "mixed" : directions[0];
  return {
    sessionId,
    overallScore,
    completedNotes: valid.length,
    totalNotes: definition.steps.length,
    averageAbsoluteCents: mean(valid.map((note) => note.meanAbsoluteCents).filter((value): value is number => value !== null)),
    voicedCoverage: mean(noteScores.map((note) => note.voicedCoverage)) ?? 0,
    stabilityScore: mean(valid.map((note) => note.stability).filter((value): value is number => value !== null)),
    noteScores,
    bestNoteIndex: best?.stepIndex ?? null,
    difficultNoteIndex: difficult?.stepIndex ?? null,
    predominantDirection
  };
};
