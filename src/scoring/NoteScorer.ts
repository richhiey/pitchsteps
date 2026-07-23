import { classifyFrame } from "./FrameClassifier";
import { pitchFrameScore, stabilityScoreFromVariation, voicedCoverageScore } from "./scoreMappings";
import type { ExerciseStep } from "../types/exercise";
import type { PitchFrame } from "../types/pitch";
import type { NoteScore } from "../types/scoring";
import { mean, median, percentile } from "../utils/math";

export const scoreNote = (step: ExerciseStep, frames: PitchFrame[]): NoteScore => {
  const scoringDuration = Math.max(0.001, step.scoringEndTime - step.scoringStartTime);
  const inside = frames.filter((frame) => frame.timestamp >= step.scoringStartTime && frame.timestamp <= step.scoringEndTime);
  const valid = inside.filter((frame) => classifyFrame(frame, step.target.midi) !== "unvoiced" && frame.centsFromTarget !== null);
  const correct = valid.filter((frame) => classifyFrame(frame, step.target.midi) === "correct-note");
  const wrongOctave = valid.filter((frame) => classifyFrame(frame, step.target.midi) === "wrong-octave");
  const wrongNote = valid.filter((frame) => classifyFrame(frame, step.target.midi) === "wrong-note");
  const coverage = Math.min(1, valid.length * 0.01 / scoringDuration);
  const cents = correct.map((frame) => frame.centsFromTarget as number);
  const medianCents = median(cents);
  const meanAbsoluteCents = mean(cents.map(Math.abs));
  const sufficientData = coverage >= 0.3 && cents.length >= 8;

  if (!sufficientData) {
    return baseScore(step, coverage, valid.length, wrongNote.length, wrongOctave.length, false);
  }

  const frameScores = cents.map((value) => pitchFrameScore(Math.abs(value))).sort((a, b) => a - b);
  const trimmed = frameScores.slice(Math.floor(frameScores.length * 0.1));
  const pitchAccuracy = 0.6 * (median(frameScores) ?? 0) + 0.4 * (mean(trimmed) ?? 0);
  const residuals = cents.map((value) => Math.abs(value - (medianCents ?? 0)));
  const p90 = percentile(residuals, 0.9) ?? 0;
  const p10 = percentile(residuals, 0.1) ?? 0;
  const stability = stabilityScoreFromVariation(p90 - p10);
  const coverageScore = voicedCoverageScore(coverage);
  const wrongOctaveRatio = wrongOctave.length / Math.max(1, valid.length);
  const wrongNoteRatio = wrongNote.length / Math.max(1, valid.length);
  const octaveScore = wrongOctaveRatio > 0.4 ? 0 : wrongOctaveRatio > 0.15 ? 50 : 100;
  const holdDurationScore = coverage >= 0.6 ? 100 : voicedCoverageScore(coverage);
  const adjustedPitchAccuracy = octaveScore === 0 ? Math.min(20, pitchAccuracy) : pitchAccuracy;
  const score = 0.6 * adjustedPitchAccuracy + 0.15 * stability + 0.15 * coverageScore + 0.05 * octaveScore + 0.05 * holdDurationScore;
  return {
    stepIndex: step.index,
    targetNote: step.target,
    score: Math.round(score),
    pitchAccuracy: Math.round(adjustedPitchAccuracy),
    stability: Math.round(stability),
    voicedCoverage: coverage,
    octaveScore,
    holdDurationScore: Math.round(holdDurationScore),
    medianCents,
    meanAbsoluteCents,
    predominantDirection: directionFromCents(medianCents),
    wrongNoteRatio,
    wrongOctaveRatio,
    sufficientData
  };
};

const baseScore = (step: ExerciseStep, coverage: number, validCount: number, wrongNoteCount: number, wrongOctaveCount: number, sufficientData: boolean): NoteScore => ({
  stepIndex: step.index,
  targetNote: step.target,
  score: null,
  pitchAccuracy: null,
  stability: null,
  voicedCoverage: coverage,
  octaveScore: null,
  holdDurationScore: Math.round(voicedCoverageScore(coverage)),
  medianCents: null,
  meanAbsoluteCents: null,
  predominantDirection: "unknown",
  wrongNoteRatio: wrongNoteCount / Math.max(1, validCount),
  wrongOctaveRatio: wrongOctaveCount / Math.max(1, validCount),
  sufficientData
});

const directionFromCents = (cents: number | null): NoteScore["predominantDirection"] => {
  if (cents === null) return "unknown";
  if (cents < -20) return "flat";
  if (cents > 20) return "sharp";
  return "centred";
};
