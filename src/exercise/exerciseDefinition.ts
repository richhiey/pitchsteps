export const DEFAULT_ROOT_MIDI = 60;
export const DEFAULT_BPM = 90;
export const DEFAULT_BEATS_PER_NOTE = 2;
export const DEFAULT_COUNT_IN_BEATS = 4;
export const MAJOR_SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11, 12] as const;
export const SOLFEGE = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti", "Do"] as const;

export const beatDurationSeconds = (bpm: number): number => 60 / bpm;

export const noteDurationSeconds = (bpm: number, beatsPerNote = DEFAULT_BEATS_PER_NOTE): number =>
  beatDurationSeconds(bpm) * beatsPerNote;
