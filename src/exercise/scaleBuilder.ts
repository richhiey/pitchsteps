import { midiToFrequency } from "../pitch/conversion/frequencyToMidi";
import { midiToNoteName } from "../pitch/conversion/midiToNote";
import type { ExerciseDefinition, ExerciseStep, GuideToneMode, TargetNote } from "../types/exercise";
import {
  DEFAULT_BEATS_PER_NOTE,
  DEFAULT_BPM,
  DEFAULT_COUNT_IN_BEATS,
  DEFAULT_ROOT_MIDI,
  MAJOR_SCALE_OFFSETS,
  SOLFEGE,
  noteDurationSeconds
} from "./exerciseDefinition";
import type { WarmupMetadata } from "./warmupCatalogue";

export interface BuildExerciseOptions {
  rootMidi?: number;
  bpm?: number;
  beatsPerNote?: number;
  countInBeats?: number;
  guideToneMode?: GuideToneMode;
}

const CHROMATIC_SOLFEGE: Record<number, TargetNote["solfege"]> = {
  0: "Do", 1: "Di", 2: "Re", 3: "Ri", 4: "Mi", 5: "Fa", 6: "Fi",
  7: "Sol", 8: "Si", 9: "La", 10: "Li", 11: "Ti"
};

export const buildMajorScaleTargets = (rootMidi = DEFAULT_ROOT_MIDI): TargetNote[] =>
  MAJOR_SCALE_OFFSETS.map((offset, index) => {
    const midi = rootMidi + offset;
    return {
      index,
      solfege: SOLFEGE[index],
      midi,
      noteName: midiToNoteName(midi),
      frequencyHz: midiToFrequency(midi),
      scaleDegree: index + 1
    };
  });

const buildPatternTargets = (pattern: number[], rootMidi: number): TargetNote[] =>
  pattern.map((offset, index) => {
    const midi = rootMidi + offset;
    return {
      index,
      solfege: CHROMATIC_SOLFEGE[((offset % 12) + 12) % 12],
      midi,
      noteName: midiToNoteName(midi),
      frequencyHz: midiToFrequency(midi),
      scaleDegree: offset
    };
  });

export const buildExerciseDefinition = ({
  rootMidi = DEFAULT_ROOT_MIDI,
  bpm = DEFAULT_BPM,
  beatsPerNote = DEFAULT_BEATS_PER_NOTE,
  countInBeats = DEFAULT_COUNT_IN_BEATS,
  guideToneMode = "each-note"
}: BuildExerciseOptions = {}): ExerciseDefinition => {
  const noteDuration = noteDurationSeconds(bpm, beatsPerNote);
  const targets = buildMajorScaleTargets(rootMidi);
  const steps: ExerciseStep[] = targets.map((target, index) => {
    const startTime = index * noteDuration;
    const endTime = startTime + noteDuration;
    const onsetGrace = Math.min(0.25, noteDuration * 0.22);
    const releaseGrace = Math.min(0.15, noteDuration * 0.12);
    return {
      index,
      target,
      startTime,
      endTime,
      scoringStartTime: startTime + onsetGrace,
      scoringEndTime: endTime - releaseGrace
    };
  });
  return {
    id: `major-scale-${rootMidi}-${bpm}-${beatsPerNote}-${guideToneMode}`,
    name: "Ascending major scale",
    rootMidi,
    bpm,
    beatsPerNote,
    countInBeats,
    steps,
    guideToneMode
  };
};

export const buildWarmupExerciseDefinition = (
  warmup: WarmupMetadata,
  options: BuildExerciseOptions = {}
): ExerciseDefinition => {
  const rootMidi = options.rootMidi ?? DEFAULT_ROOT_MIDI;
  const bpm = options.bpm ?? DEFAULT_BPM;
  const beatsPerNote = options.beatsPerNote ?? DEFAULT_BEATS_PER_NOTE;
  const countInBeats = options.countInBeats ?? DEFAULT_COUNT_IN_BEATS;
  const guideToneMode = options.guideToneMode ?? "each-note";
  const noteDuration = noteDurationSeconds(bpm, beatsPerNote);
  const targets = buildPatternTargets(warmup.expectedNotes, rootMidi);
  const steps: ExerciseStep[] = targets.map((target, index) => {
    const startTime = index * noteDuration;
    const endTime = startTime + noteDuration;
    const onsetGrace = Math.min(0.25, noteDuration * 0.22);
    const releaseGrace = Math.min(0.15, noteDuration * 0.12);
    return { index, target, startTime, endTime, scoringStartTime: startTime + onsetGrace, scoringEndTime: endTime - releaseGrace };
  });
  return {
    id: `${warmup.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${rootMidi}-${bpm}-${beatsPerNote}-${guideToneMode}`,
    name: warmup.title,
    rootMidi,
    bpm,
    beatsPerNote,
    countInBeats,
    steps,
    guideToneMode
  };
};
