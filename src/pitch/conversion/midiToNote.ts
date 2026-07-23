const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export const midiToPitchClass = (midi: number): number => ((Math.round(midi) % 12) + 12) % 12;

export const midiToOctave = (midi: number): number => Math.floor(Math.round(midi) / 12) - 1;

export const midiToNoteName = (midi: number): string => `${NOTE_NAMES[midiToPitchClass(midi)]}${midiToOctave(midi)}`;

export const parseNoteName = (note: string): number | null => {
  const match = /^([A-G])(#?)(-?\d+)$/.exec(note.trim());
  if (!match) return null;
  const pitchClass = NOTE_NAMES.indexOf(`${match[1]}${match[2]}` as (typeof NOTE_NAMES)[number]);
  if (pitchClass < 0) return null;
  return (Number(match[3]) + 1) * 12 + pitchClass;
};

export const NOTE_OPTIONS = Array.from({ length: 25 }, (_, index) => {
  const midi = 48 + index;
  return { midi, label: midiToNoteName(midi) };
});
