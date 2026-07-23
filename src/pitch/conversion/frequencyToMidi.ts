export const frequencyToMidi = (frequencyHz: number): number => 69 + 12 * Math.log2(frequencyHz / 440);

export const midiToFrequency = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

export const nearestMidi = (frequencyHz: number): number => Math.round(frequencyToMidi(frequencyHz));
