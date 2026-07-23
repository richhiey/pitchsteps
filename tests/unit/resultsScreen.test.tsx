import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultsScreen } from "../../src/components/ResultsScreen";
import { buildExerciseDefinition } from "../../src/exercise/scaleBuilder";
import { midiToFrequency } from "../../src/pitch/conversion/frequencyToMidi";
import { scoreSession } from "../../src/scoring/SessionScorer";
import type { PitchFrame } from "../../src/types/pitch";

describe("ResultsScreen", () => {
  it("retains the completed SVG performance timeline above the note assessments", () => {
    const exercise = buildExerciseDefinition({ rootMidi: 60, bpm: 90 });
    const pitchFrames: PitchFrame[] = [0.1, 0.12, 0.14].map((timestamp) => ({
      sessionId: "results-test",
      timestamp,
      frequencyHz: midiToFrequency(60),
      midi: 60,
      noteName: "C4",
      targetMidi: 60,
      centsFromTarget: 0,
      centsFromNearestNote: 0,
      confidence: 0.95,
      voicedProbability: 0.97,
      voiced: true,
      rmsDbfs: -22,
      clipped: false
    }));
    const result = scoreSession("results-test", exercise, pitchFrames);
    const { container } = render(
      <ResultsScreen
        result={result}
        exercise={exercise}
        pitchFrames={pitchFrames}
        recordingUrl="blob:results-test"
        recordingStatus="ready"
        onRetry={vi.fn()}
        onChange={vi.fn()}
        onReplay={vi.fn()}
      />
    );

    expect(screen.getByText("Your pitch over time")).toBeTruthy();
    expect(screen.getByTestId("pitch-timeline").getAttribute("aria-label")).toContain("Completed exercise");
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelectorAll(".note-result")).toHaveLength(8);
    expect(screen.getByText("Timeline segment 1")).toBeTruthy();
    expect(screen.getByText("Hear your performance")).toBeTruthy();
    const audio = container.querySelector("audio");
    expect(audio?.getAttribute("src")).toBe("blob:results-test");

    const timeline = container.querySelector(".results-performance");
    const estimate = container.querySelector(".results-summary");
    expect(Boolean(timeline && estimate && timeline.compareDocumentPosition(estimate) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    const expectedLine = container.querySelector(".pitch-timeline__expected-line");
    const expectedPoints = expectedLine?.getAttribute("points");
    const trailCount = container.querySelectorAll(".pitch-timeline__trail").length;
    const playhead = container.querySelector<SVGGElement>(".pitch-timeline__playhead-group");
    if (!audio) throw new Error("Expected assessment audio control");
    Object.defineProperty(audio, "duration", { configurable: true, value: 10 });
    audio.currentTime = 2;
    fireEvent.play(audio);

    expect(playhead?.style.transform).toContain("179.2");
    expect(expectedLine?.getAttribute("points")).toBe(expectedPoints);
    expect(trailCount).toBeGreaterThan(0);
    expect(container.querySelectorAll(".pitch-timeline__trail")).toHaveLength(trailCount);
    expect(container.querySelectorAll(".pitch-timeline__target")).toHaveLength(8);
  });
});
