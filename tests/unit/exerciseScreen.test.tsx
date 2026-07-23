import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExerciseScreen } from "../../src/components/ExerciseScreen";
import { buildExerciseDefinition } from "../../src/exercise/scaleBuilder";

describe("ExerciseScreen", () => {
  it("renders the live signal and note feedback below the timeline", () => {
    const exercise = buildExerciseDefinition();

    render(
      <ExerciseScreen
        exercise={exercise}
        step={exercise.steps[0]}
        remaining={1.2}
        elapsed={0}
        latestPitch={null}
        pitchFrames={[]}
        level={null}
        onStop={vi.fn()}
      />
    );

    const timeline = screen.getByTestId("pitch-timeline");
    const feedback = document.querySelector(".exercise-feedback");
    const stop = screen.getByRole("button", { name: "Stop" });
    expect(feedback).toBeTruthy();
    expect(timeline.compareDocumentPosition(feedback as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(feedback?.querySelector(".exercise-feedback__controls")?.contains(stop)).toBe(true);
    expect(feedback?.querySelector('[aria-label="Microphone level: Waiting for signal"]')).toBeTruthy();
    expect(feedback?.querySelector('[aria-label="Live pitch feedback"]')).toBeTruthy();
  });
});
