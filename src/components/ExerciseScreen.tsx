import { useEffect, useMemo, useRef } from "react";
import { ArrowDown, ArrowUp, CircleCheck, Ear, Square } from "lucide-react";
import { midiToFrequency } from "../pitch/conversion/frequencyToMidi";
import { midiToNoteName } from "../pitch/conversion/midiToNote";
import type { ExerciseDefinition, ExerciseStep } from "../types/exercise";
import type { PitchFrame } from "../types/pitch";
import { interpretFeedback, type PitchFeedbackState } from "../visualization/pitchLaneModel";
import { buildPitchTimelineModel } from "../visualization/pitchTimelineModel";
import { InputMeter } from "./InputMeter";
import { PitchTimeline } from "./PitchTimeline";
import type { LevelFrame } from "../types/audio";

interface ExerciseScreenProps {
  exercise: ExerciseDefinition;
  step: ExerciseStep;
  remaining: number;
  elapsed: number;
  latestPitch: PitchFrame | null;
  pitchFrames: PitchFrame[];
  level: LevelFrame | null;
  onStop: () => void;
}

export function ExerciseScreen({ exercise, step, remaining, elapsed, latestPitch, pitchFrames, level, onStop }: ExerciseScreenProps) {
  const previousState = useRef<PitchFeedbackState>("listening");
  const timelineModel = useMemo(
    () => buildPitchTimelineModel(exercise, pitchFrames, elapsed),
    [exercise, pitchFrames, elapsed]
  );
  const displayMidi = timelineModel.currentPoint?.midi ?? null;
  const detectedMidi = displayMidi === null ? null : Math.round(displayMidi);
  const detectedCents = displayMidi === null ? null : (displayMidi - step.target.midi) * 100;
  const feedback = interpretFeedback(
    displayMidi !== null && !timelineModel.holdingLastPitch,
    latestPitch?.confidence ?? 0,
    detectedCents,
    detectedMidi,
    step.target.midi,
    previousState.current
  );
  useEffect(() => {
    previousState.current = feedback.state;
  }, [feedback.state]);
  const FeedbackIcon = feedback.state === "flat"
    ? ArrowUp
    : feedback.state === "sharp"
      ? ArrowDown
      : feedback.state === "in-tune"
      ? CircleCheck
        : Ear;
  const displayNoteName = displayMidi === null ? null : midiToNoteName(displayMidi);
  const displayFrequency = displayMidi === null ? null : midiToFrequency(displayMidi);
  return (
    <main className="app-main app-main--exercise">
      <div className="exercise-topbar">
        <InputMeter level={level} />
        <button className="button button--ghost" onClick={onStop}>
          <Square aria-hidden="true" />
          Stop
        </button>
      </div>
      <section className="session-readout" aria-label="Live pitch feedback">
        <div className="session-readout__target">
          <span>Now sing</span>
          <strong>{step.target.solfege}</strong>
          <b>{step.target.noteName}</b>
        </div>
        <div className={`session-readout__coach session-readout__coach--${feedback.state}`}>
          <FeedbackIcon aria-hidden="true" />
          <div>
            <strong aria-live="polite">{feedback.instruction}</strong>
            <span>
              {displayNoteName
                ? `${timelineModel.holdingLastPitch ? "Holding" : "Hearing"} ${displayNoteName}${detectedCents === null ? "" : ` · ${detectedCents >= 0 ? "+" : ""}${Math.round(detectedCents)} cents`}`
                : "Listening for your voice"}
            </span>
          </div>
        </div>
        <div className="session-readout__stats">
          <span>Note ends in</span>
          <strong>{remaining.toFixed(1)}s</strong>
          <small>{displayFrequency ? `${displayFrequency.toFixed(1)} Hz` : "— Hz"}</small>
        </div>
      </section>
      <PitchTimeline
        exercise={exercise}
        activeStep={step}
        model={timelineModel}
      />
    </main>
  );
}
