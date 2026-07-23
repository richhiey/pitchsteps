import type { ExerciseDefinition } from "../types/exercise";
import type { PitchFrame } from "../types/pitch";
import { clamp } from "../utils/math";
import { interpretFeedback, type PitchFeedbackState } from "./pitchLaneModel";

export interface TimelineTargetBand {
  index: number;
  solfege: string;
  noteName: string;
  midi: number;
  x: number;
  width: number;
  y: number;
}

export interface TimelinePitchPoint {
  x: number;
  y: number;
  midi: number;
  timestamp: number;
}

export interface TimelineTrail {
  state: PitchFeedbackState;
  points: TimelinePitchPoint[];
}

export interface PitchTimelineModel {
  minMidi: number;
  maxMidi: number;
  duration: number;
  playheadX: number;
  targets: TimelineTargetBand[];
  expectedPoints: TimelinePitchPoint[];
  trails: TimelineTrail[];
  currentPoint: TimelinePitchPoint | null;
  currentState: PitchFeedbackState;
  holdingLastPitch: boolean;
  outOfRange: "above" | "below" | null;
}

const isRenderableFrame = (frame: PitchFrame): frame is PitchFrame & { midi: number } =>
  frame.voiced && frame.confidence >= 0.6 && !frame.clipped && frame.midi !== null;

const feedbackForMidi = (midi: number, timestamp: number, confidence: number, exercise: ExerciseDefinition): PitchFeedbackState => {
  const step = exercise.steps.find((candidate) => timestamp >= candidate.startTime && timestamp < candidate.endTime);
  if (!step) return "listening";
  const cents = (midi - step.target.midi) * 100;
  return interpretFeedback(true, confidence, cents, Math.round(midi), step.target.midi).state;
};

const DISPLAY_HOLD_SECONDS = 0.32;
const DISPLAY_TIME_CONSTANT_SECONDS = 0.075;
const MAX_INPUT_JUMP_SEMITONES = 1.25;
const DISPLAY_SAMPLE_INTERVAL_SECONDS = 0.025;

export const buildPitchTimelineModel = (
  exercise: ExerciseDefinition,
  frames: PitchFrame[],
  elapsed: number
): PitchTimelineModel => {
  const duration = exercise.steps.at(-1)?.endTime ?? 0;
  const minMidi = exercise.rootMidi - 1;
  const maxMidi = exercise.rootMidi + 13;
  const rowCount = maxMidi - minMidi + 1;
  const safeDuration = Math.max(duration, Number.EPSILON);
  const toPoint = (midi: number, timestamp: number): TimelinePitchPoint => ({
    x: clamp(timestamp / safeDuration, 0, 1),
    y: clamp((maxMidi - midi + 0.5) / rowCount, 0, 1),
    midi,
    timestamp
  });

  const targets = exercise.steps.map((step) => ({
    index: step.index,
    solfege: step.target.solfege,
    noteName: step.target.noteName,
    midi: step.target.midi,
    x: step.startTime / safeDuration,
    width: (step.endTime - step.startTime) / safeDuration,
    y: (maxMidi - step.target.midi + 0.5) / rowCount
  }));
  const expectedPoints = exercise.steps.flatMap((step) => [
    toPoint(step.target.midi, step.startTime),
    toPoint(step.target.midi, step.endTime)
  ]);

  const trails: TimelineTrail[] = [];
  let previousPoint: TimelinePitchPoint | null = null;
  let activeTrail: TimelineTrail | null = null;
  let smoothedMidi: number | null = null;
  let lastFrameTime: number | null = null;
  let lastValidAt: number | null = null;
  let lastFrameWasRenderable = false;
  let lastConfidence = 0;
  let lastRenderedAt = Number.NEGATIVE_INFINITY;
  let currentPoint: TimelinePitchPoint | null = null;
  let currentState: PitchFeedbackState = "listening";
  let holdingLastPitch = false;

  const appendPoint = (point: TimelinePitchPoint, state: PitchFeedbackState) => {
    if (!activeTrail || activeTrail.state !== state) {
      activeTrail = {
        state,
        points: previousPoint ? [previousPoint, point] : [point]
      };
      trails.push(activeTrail);
    } else {
      activeTrail.points.push(point);
    }
    previousPoint = point;
    lastRenderedAt = point.timestamp;
    currentPoint = point;
    currentState = state;
  };

  const breakTrail = () => {
    previousPoint = null;
    activeTrail = null;
    currentPoint = null;
    currentState = "listening";
    holdingLastPitch = false;
  };

  const eligibleFrames = frames.filter((frame) => frame.timestamp >= 0 && frame.timestamp <= Math.min(elapsed, duration));
  eligibleFrames.forEach((frame, index) => {
    const isLast = index === eligibleFrames.length - 1;
    const deltaTime = Math.max(0.001, frame.timestamp - (lastFrameTime ?? frame.timestamp - 0.016));
    lastFrameTime = frame.timestamp;

    if (isRenderableFrame(frame)) {
      lastFrameWasRenderable = true;
      if (smoothedMidi === null) {
        smoothedMidi = frame.midi;
      } else {
        const boundedInput = smoothedMidi + clamp(frame.midi - smoothedMidi, -MAX_INPUT_JUMP_SEMITONES, MAX_INPUT_JUMP_SEMITONES);
        const alpha = clamp(1 - Math.exp(-deltaTime / DISPLAY_TIME_CONSTANT_SECONDS), 0.12, 0.55);
        smoothedMidi += alpha * (boundedInput - smoothedMidi);
      }
      lastValidAt = frame.timestamp;
      lastConfidence = frame.confidence;
      holdingLastPitch = false;
    } else {
      lastFrameWasRenderable = false;
      const withinHold = smoothedMidi !== null && lastValidAt !== null && frame.timestamp - lastValidAt <= DISPLAY_HOLD_SECONDS;
      if (!withinHold) {
        smoothedMidi = null;
        breakTrail();
        return;
      }
      holdingLastPitch = true;
    }

    if (smoothedMidi === null) return;
    const shouldRender = frame.timestamp - lastRenderedAt >= DISPLAY_SAMPLE_INTERVAL_SECONDS || isLast;
    if (!shouldRender) return;
    const state = holdingLastPitch ? "listening" : feedbackForMidi(smoothedMidi, frame.timestamp, frame.confidence, exercise);
    appendPoint(toPoint(smoothedMidi, frame.timestamp), state);
  });

  const displayElapsed = Math.min(elapsed, duration);
  if (smoothedMidi !== null && lastValidAt !== null && displayElapsed > (lastFrameTime ?? 0)) {
    const timeSinceValid = displayElapsed - lastValidAt;
    if (timeSinceValid <= DISPLAY_HOLD_SECONDS) {
      holdingLastPitch = !lastFrameWasRenderable || timeSinceValid > 0.08;
      const state = holdingLastPitch
        ? "listening"
        : feedbackForMidi(smoothedMidi, displayElapsed, lastConfidence, exercise);
      appendPoint(toPoint(smoothedMidi, displayElapsed), state);
    } else {
      breakTrail();
    }
  }

  const finalPoint = currentPoint as TimelinePitchPoint | null;
  const outOfRange = finalPoint
    ? finalPoint.midi > maxMidi
      ? "above"
      : finalPoint.midi < minMidi
        ? "below"
        : null
    : null;

  return {
    minMidi,
    maxMidi,
    duration,
    playheadX: clamp(elapsed / safeDuration, 0, 1),
    targets,
    expectedPoints,
    trails,
    currentPoint: finalPoint,
    currentState,
    holdingLastPitch,
    outOfRange
  };
};
