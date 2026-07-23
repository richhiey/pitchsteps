import { describe, expect, it } from "vitest";
import { buildExerciseDefinition } from "../../src/exercise/scaleBuilder";
import { midiToFrequency } from "../../src/pitch/conversion/frequencyToMidi";
import { scoreNote } from "../../src/scoring/NoteScorer";
import { scoreSession } from "../../src/scoring/SessionScorer";
import type { PitchFrame } from "../../src/types/pitch";

const frame = (timestamp: number, frequencyHz: number, centsFromTarget: number): PitchFrame => ({
  sessionId: "test",
  timestamp,
  frequencyHz,
  midi: 60,
  noteName: "C4",
  targetMidi: 60,
  centsFromTarget,
  centsFromNearestNote: centsFromTarget,
  confidence: 0.95,
  voicedProbability: 0.95,
  voiced: true,
  rmsDbfs: -24,
  clipped: false
});

describe("scoring", () => {
  it("scores stable centred singing", () => {
    const exercise = buildExerciseDefinition({ rootMidi: 60, bpm: 90 });
    const step = exercise.steps[0];
    const frames = Array.from({ length: 90 }, (_, index) => frame(step.scoringStartTime + index * 0.01, midiToFrequency(60), 4));
    const score = scoreNote(step, frames);
    expect(score.sufficientData).toBe(true);
    expect(score.score).toBeGreaterThan(90);
  });

  it("aggregates session scores deterministically", () => {
    const exercise = buildExerciseDefinition({ rootMidi: 60, bpm: 90 });
    const frames = exercise.steps.flatMap((step) =>
      Array.from({ length: 90 }, (_, index) => frame(step.scoringStartTime + index * 0.01, step.target.frequencyHz, 0))
    );
    const result = scoreSession("test", exercise, frames);
    expect(result.completedNotes).toBe(8);
    expect(result.overallScore).toBeGreaterThan(90);
  });
});
