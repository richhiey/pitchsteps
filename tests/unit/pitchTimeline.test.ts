import { describe, expect, it } from "vitest";
import { buildExerciseDefinition } from "../../src/exercise/scaleBuilder";
import type { PitchFrame } from "../../src/types/pitch";
import { buildPitchTimelineModel } from "../../src/visualization/pitchTimelineModel";

const frame = (timestamp: number, midi: number | null, overrides: Partial<PitchFrame> = {}): PitchFrame => ({
  sessionId: "test",
  timestamp,
  frequencyHz: midi === null ? null : 440 * 2 ** ((midi - 69) / 12),
  midi,
  noteName: midi === null ? null : "C4",
  targetMidi: 60,
  centsFromTarget: midi === null ? null : (midi - 60) * 100,
  centsFromNearestNote: 0,
  confidence: 0.95,
  voicedProbability: 0.98,
  voiced: midi !== null,
  rmsDbfs: -24,
  clipped: false,
  ...overrides
});

describe("pitch timeline model", () => {
  it("maps the exercise to a focused register and full-width target bands", () => {
    const exercise = buildExerciseDefinition({ rootMidi: 60, bpm: 60 });
    const model = buildPitchTimelineModel(exercise, [], 0);

    expect(model.minMidi).toBe(59);
    expect(model.maxMidi).toBe(73);
    expect(model.duration).toBe(16);
    expect(model.targets).toHaveLength(8);
    expect(model.targets[0]).toMatchObject({ x: 0, width: 0.125, midi: 60 });
    expect(model.targets[7].x + model.targets[7].width).toBeCloseTo(1);
  });

  it("smooths fractional MIDI pitch and limits a sudden detector outlier", () => {
    const exercise = buildExerciseDefinition({ rootMidi: 60, bpm: 60 });
    const frames = [
      frame(0.1, 60),
      frame(0.12, 48),
      frame(0.14, 60.3)
    ];
    const model = buildPitchTimelineModel(exercise, frames, 0.14);

    expect(model.currentPoint?.midi).toBeGreaterThan(59.7);
    expect(model.currentPoint?.midi).toBeLessThan(60.3);
    expect(model.currentPoint?.y).toBeLessThan(1);
    expect(model.holdingLastPitch).toBe(false);
  });

  it("holds the last smoothed pitch through a short detector dropout instead of falling to zero", () => {
    const exercise = buildExerciseDefinition({ rootMidi: 60, bpm: 60 });
    const model = buildPitchTimelineModel(exercise, [frame(0.1, 60), frame(0.2, null)], 0.25);

    expect(model.currentPoint?.midi).toBe(60);
    expect(model.currentPoint?.timestamp).toBe(0.25);
    expect(model.holdingLastPitch).toBe(true);
    expect(model.currentState).toBe("listening");
  });

  it("extends a fresh valid sample to the playhead without treating normal frame spacing as a dropout", () => {
    const exercise = buildExerciseDefinition({ rootMidi: 60, bpm: 60 });
    const model = buildPitchTimelineModel(exercise, [frame(0.1, 60)], 0.12);

    expect(model.currentPoint?.timestamp).toBe(0.12);
    expect(model.holdingLastPitch).toBe(false);
    expect(model.currentState).toBe("in-tune");
  });

  it("shows a gap after the hold expires and reports pitches outside the visible register", () => {
    const exercise = buildExerciseDefinition({ rootMidi: 60, bpm: 60 });
    const stale = buildPitchTimelineModel(exercise, [frame(0.1, 60)], 0.5);
    const above = buildPitchTimelineModel(exercise, [frame(0.49, 74)], 0.5);

    expect(stale.currentPoint).toBeNull();
    expect(above.currentPoint?.y).toBe(0);
    expect(above.outOfRange).toBe("above");
  });
});
