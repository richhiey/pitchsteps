import type { ExerciseDefinition, ExerciseStep } from "../types/exercise";
import { beatDurationSeconds } from "./exerciseDefinition";

export interface ExerciseClockSnapshot {
  phase: "count-in" | "running" | "complete";
  elapsed: number;
  countInBeat: number | null;
  activeStep: ExerciseStep | null;
  remainingInStep: number;
}

export const getExerciseSnapshot = (
  definition: ExerciseDefinition,
  audioCurrentTime: number,
  scheduledExerciseStartTime: number
): ExerciseClockSnapshot => {
  const countInDuration = definition.countInBeats * beatDurationSeconds(definition.bpm);
  const elapsed = Math.max(0, audioCurrentTime - scheduledExerciseStartTime);
  if (elapsed < countInDuration) {
    return {
      phase: "count-in",
      elapsed,
      countInBeat: Math.floor(elapsed / beatDurationSeconds(definition.bpm)) + 1,
      activeStep: null,
      remainingInStep: countInDuration - elapsed
    };
  }

  const exerciseElapsed = elapsed - countInDuration;
  const activeStep = definition.steps.find((step) => exerciseElapsed >= step.startTime && exerciseElapsed < step.endTime) ?? null;
  if (!activeStep) {
    return { phase: "complete", elapsed, countInBeat: null, activeStep: null, remainingInStep: 0 };
  }
  return {
    phase: "running",
    elapsed,
    countInBeat: null,
    activeStep,
    remainingInStep: activeStep.endTime - exerciseElapsed
  };
};
