import { useEffect, useRef, type RefObject } from "react";
import { midiToNoteName, midiToPitchClass } from "../pitch/conversion/midiToNote";
import type { ExerciseDefinition, ExerciseStep } from "../types/exercise";
import type { PitchTimelineModel } from "../visualization/pitchTimelineModel";

interface PitchTimelineProps {
  exercise: ExerciseDefinition;
  activeStep: ExerciseStep | null;
  model: PitchTimelineModel;
  completed?: boolean;
  disabled?: boolean;
  countInBeat?: number | null;
  playbackAudioRef?: RefObject<HTMLAudioElement | null>;
  playbackEnabled?: boolean;
}

const WIDTH = 1000;
const HEIGHT = 450;
const KEYBOARD_WIDTH = 78;
const PLOT_LEFT = 92;
const PLOT_RIGHT = 988;
const PLOT_TOP = 15;
const PLOT_BOTTOM = 435;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

const pointString = (points: { x: number; y: number }[]) =>
  points.map((point) => `${PLOT_LEFT + point.x * PLOT_WIDTH},${PLOT_TOP + point.y * PLOT_HEIGHT}`).join(" ");

export function PitchTimeline({
  exercise,
  activeStep,
  model,
  completed = false,
  disabled = false,
  countInBeat = null,
  playbackAudioRef,
  playbackEnabled = false
}: PitchTimelineProps) {
  const playheadGroupRef = useRef<SVGGElement>(null);
  const progressLabelRef = useRef<HTMLSpanElement>(null);
  const rowCount = model.maxMidi - model.minMidi + 1;
  const rowHeight = PLOT_HEIGHT / rowCount;
  const exerciseNotes = new Set(exercise.steps.map((step) => step.target.midi));
  const displayMidi = model.currentPoint?.midi ?? null;
  const liveCents = displayMidi === null || activeStep === null
    ? null
    : (displayMidi - activeStep.target.midi) * 100;
  const playheadProgress = playbackEnabled ? model.playheadX : 0;
  const progress = Math.round(playheadProgress * 100);
  const detected = displayMidi !== null
    ? `${midiToNoteName(displayMidi)}${liveCents === null ? "" : `, ${liveCents >= 0 ? "+" : ""}${Math.round(liveCents)} cents`}${model.holdingLastPitch ? ", held" : ""}`
    : "listening for pitch";
  const guidance = disabled
    ? "Ready to begin"
    : completed
    ? "Session complete"
    : model.holdingLastPitch
      ? "Keep singing"
      : model.currentState === "in-tune"
        ? "Hold it"
        : model.currentState;
  const targetDescription = disabled
    ? "Exercise ready to start."
    : activeStep
    ? `Target ${activeStep.target.solfege}, ${activeStep.target.noteName}.`
    : "Completed exercise.";
  const ariaLabel = `Pitch timeline. ${targetDescription} Smoothed pitch ${detected}. Guidance: ${guidance}. ${progress} percent complete.`;

  const pointX = model.currentPoint ? PLOT_LEFT + model.currentPoint.x * PLOT_WIDTH : null;
  const pointY = model.currentPoint ? PLOT_TOP + model.currentPoint.y * PLOT_HEIGHT : null;
  const playheadX = PLOT_LEFT + playheadProgress * PLOT_WIDTH;
  const playheadOffset = playheadX - PLOT_LEFT;

  useEffect(() => {
    const audio = playbackAudioRef?.current;
    const playhead = playheadGroupRef.current;
    const progressLabel = progressLabelRef.current;
    if (!playbackEnabled || !audio || !playhead || !progressLabel) return;

    let animationFrame: number | null = null;
    const updatePlayhead = () => {
      const playbackDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : model.duration;
      const playbackProgress = playbackDuration > 0 ? Math.min(1, Math.max(0, audio.currentTime / playbackDuration)) : 0;
      playhead.style.transform = `translateX(${playbackProgress * PLOT_WIDTH}px)`;
      progressLabel.textContent = audio.ended ? "Complete" : `${Math.round(playbackProgress * 100)}%`;
      if (!audio.paused && !audio.ended) animationFrame = requestAnimationFrame(updatePlayhead);
    };
    const startAnimation = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      updatePlayhead();
    };
    const stopAnimation = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
      updatePlayhead();
    };

    audio.addEventListener("play", startAnimation);
    audio.addEventListener("pause", stopAnimation);
    audio.addEventListener("seeked", updatePlayhead);
    audio.addEventListener("ended", stopAnimation);
    return () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      audio.removeEventListener("play", startAnimation);
      audio.removeEventListener("pause", stopAnimation);
      audio.removeEventListener("seeked", updatePlayhead);
      audio.removeEventListener("ended", stopAnimation);
    };
  }, [model.duration, playbackAudioRef, playbackEnabled]);

  return (
    <figure className={`pitch-timeline ${disabled ? "pitch-timeline--disabled" : ""} ${countInBeat !== null ? "pitch-timeline--counting-in" : ""}`} aria-label={ariaLabel} data-testid="pitch-timeline">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true" focusable="false">
        <rect x={PLOT_LEFT} y={PLOT_TOP} width={PLOT_WIDTH} height={PLOT_HEIGHT} rx="12" className="pitch-timeline__canvas" />

        {Array.from({ length: rowCount }, (_, index) => {
          const midi = model.maxMidi - index;
          const pitchClass = midiToPitchClass(midi);
          const isBlack = BLACK_PITCH_CLASSES.has(pitchClass);
          const isExerciseNote = exerciseNotes.has(midi);
          const y = PLOT_TOP + index * rowHeight;
          return (
            <g key={midi}>
              <rect
                x={PLOT_LEFT}
                y={y}
                width={PLOT_WIDTH}
                height={rowHeight}
                className={`pitch-timeline__row ${isBlack ? "pitch-timeline__row--black" : ""} ${isExerciseNote ? "pitch-timeline__row--exercise" : ""}`}
              />
              <line x1={PLOT_LEFT} y1={y + rowHeight} x2={PLOT_RIGHT} y2={y + rowHeight} className="pitch-timeline__grid-line" />
              <rect
                x="2"
                y={y}
                width={isBlack ? KEYBOARD_WIDTH * 0.67 : KEYBOARD_WIDTH}
                height={rowHeight}
                rx="2"
                className={isBlack ? "pitch-timeline__key pitch-timeline__key--black" : "pitch-timeline__key"}
              />
              <text
                x={isBlack ? KEYBOARD_WIDTH * 0.58 : KEYBOARD_WIDTH - 7}
                y={y + rowHeight / 2 + 4}
                className={isBlack ? "pitch-timeline__key-label pitch-timeline__key-label--black" : "pitch-timeline__key-label"}
              >
                {midiToNoteName(midi)}
              </text>
            </g>
          );
        })}

        <polyline points={pointString(model.expectedPoints)} className="pitch-timeline__expected-line" />

        {model.targets.map((target) => {
          const x = PLOT_LEFT + target.x * PLOT_WIDTH + 3;
          const width = Math.max(2, target.width * PLOT_WIDTH - 6);
          const y = PLOT_TOP + target.y * PLOT_HEIGHT - rowHeight * 0.36;
          const isActive = !completed && target.index === activeStep?.index;
          const isComplete = completed || (activeStep !== null && target.index < activeStep.index);
          return (
            <g
              key={target.index}
              className={`pitch-timeline__target ${isActive ? "pitch-timeline__target--active" : ""} ${isComplete ? "pitch-timeline__target--complete" : ""}`}
            >
              <rect x={x} y={y} width={width} height={rowHeight * 0.72} rx="7" />
              <text x={x + width / 2} y={y + rowHeight * 0.47}>
                {target.solfege} · {target.noteName}
              </text>
            </g>
          );
        })}

        <g className="pitch-timeline__trail-group">
          {model.trails.map((trail, index) =>
            trail.points.length === 1 ? (
              <circle
                key={`${trail.state}-${index}`}
                cx={PLOT_LEFT + trail.points[0].x * PLOT_WIDTH}
                cy={PLOT_TOP + trail.points[0].y * PLOT_HEIGHT}
                r="2.6"
                className={`pitch-timeline__trail pitch-timeline__trail--${trail.state}`}
              />
            ) : (
              <polyline
                key={`${trail.state}-${index}`}
                points={pointString(trail.points)}
                className={`pitch-timeline__trail pitch-timeline__trail--${trail.state}`}
              />
            )
          )}
        </g>

        <g
          ref={playheadGroupRef}
          className={`pitch-timeline__playhead-group ${playbackEnabled ? "pitch-timeline__playhead-group--playback" : ""}`}
          style={{ transform: `translateX(${playheadOffset}px)` }}
        >
          <line x1={PLOT_LEFT} y1={PLOT_TOP - 4} x2={PLOT_LEFT} y2={PLOT_BOTTOM + 4} className="pitch-timeline__playhead" />
          <path d={`M ${PLOT_LEFT - 7} ${PLOT_TOP - 7} h 14 l -7 8 z`} className="pitch-timeline__playhead-cap" />
        </g>

        {pointX !== null && pointY !== null ? (
          <g className={`pitch-timeline__live-point ${model.holdingLastPitch ? "pitch-timeline__live-point--holding" : ""}`}>
            <circle cx={pointX} cy={pointY} r="9" />
            {model.outOfRange ? (
              <path
                d={model.outOfRange === "above"
                  ? `M ${pointX - 5} ${PLOT_TOP + 5} l 5 -7 l 5 7`
                  : `M ${pointX - 5} ${PLOT_BOTTOM - 5} l 5 7 l 5 -7`}
                className="pitch-timeline__range-arrow"
              />
            ) : null}
          </g>
        ) : null}
      </svg>
      {countInBeat !== null ? (
        <div className="pitch-timeline__count-in" aria-live="polite" aria-label={`Count in ${countInBeat}`}>
          {countInBeat}
        </div>
      ) : null}
      <figcaption>
        <span><i className="legend-line legend-line--target" /> Expected pitch</span>
        <span><i className="legend-line legend-line--voice" /> Smoothed voice</span>
        <span ref={progressLabelRef} className="pitch-timeline__progress">{completed ? "Complete" : `${progress}%`}</span>
      </figcaption>
    </figure>
  );
}
