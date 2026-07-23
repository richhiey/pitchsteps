import { describe, expect, it } from "vitest";
import { beatDurationSeconds } from "../../src/exercise/exerciseDefinition";
import { getExerciseSnapshot } from "../../src/exercise/ExerciseClock";
import { buildExerciseDefinition, buildMajorScaleTargets } from "../../src/exercise/scaleBuilder";
import { transitionSession } from "../../src/exercise/sessionMachine";

describe("exercise model", () => {
  it("builds an ascending major scale from C4", () => {
    expect(buildMajorScaleTargets(60).map((note) => note.noteName)).toEqual(["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]);
  });

  it("uses two-beat note timing with scoring exclusions", () => {
    const exercise = buildExerciseDefinition({ bpm: 90 });
    expect(beatDurationSeconds(90)).toBeCloseTo(0.666666, 4);
    expect(exercise.steps[0].endTime).toBeCloseTo(1.333333, 4);
    expect(exercise.steps[0].scoringStartTime).toBeCloseTo(0.25, 4);
    expect(exercise.steps[0].scoringEndTime).toBeLessThan(exercise.steps[0].endTime);
  });

  it("derives count-in and active notes from audio time", () => {
    const exercise = buildExerciseDefinition({ bpm: 60 });
    expect(getExerciseSnapshot(exercise, 2.2, 0).phase).toBe("count-in");
    const running = getExerciseSnapshot(exercise, 4.5, 0);
    expect(running.phase).toBe("running");
    expect(running.activeStep?.index).toBe(0);
  });

  it("applies explicit state transitions", () => {
    expect(transitionSession("idle", "REQUEST_MICROPHONE")).toBe("requesting-microphone");
    expect(transitionSession("requesting-microphone", "MICROPHONE_GRANTED")).toBe("calibrating");
    expect(transitionSession("ready", "START_EXERCISE")).toBe("counting-in");
    expect(transitionSession("running", "EXERCISE_FINISHED")).toBe("completed");
  });
});
