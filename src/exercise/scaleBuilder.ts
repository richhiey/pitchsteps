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

export interface BuildExerciseOptions {
  rootMidi?: number;
  bpm?: number;
  beatsPerNote?: number;
  countInBeats?: number;
  guideToneMode?: GuideToneMode;
}

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
