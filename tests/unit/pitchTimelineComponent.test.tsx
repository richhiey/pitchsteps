import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PitchTimeline } from "../../src/components/PitchTimeline";
import { buildExerciseDefinition } from "../../src/exercise/scaleBuilder";
import { buildPitchTimelineModel } from "../../src/visualization/pitchTimelineModel";

describe("PitchTimeline", () => {
  it("renders the complete exercise with an accessible live summary", () => {
    const exercise = buildExerciseDefinition({ rootMidi: 60, bpm: 90 });
    const model = buildPitchTimelineModel(exercise, [], 0);
    const { container } = render(
      <PitchTimeline
        exercise={exercise}
        activeStep={exercise.steps[0]}
        model={model}
      />
    );

    expect(screen.getByTestId("pitch-timeline").getAttribute("aria-label")).toContain("Target Do, C4");
    expect(container.querySelectorAll(".pitch-timeline__target")).toHaveLength(8);
    expect(container.querySelectorAll(".pitch-timeline__key")).toHaveLength(15);
  });
});
