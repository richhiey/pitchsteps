import { midiToFrequency, nearestMidi } from "./frequencyToMidi";

export const centsBetween = (frequencyHz: number, targetFrequencyHz: number): number =>
  1200 * Math.log2(frequencyHz / targetFrequencyHz);

export const centsFromNearestNote = (frequencyHz: number): number => centsBetween(frequencyHz, midiToFrequency(nearestMidi(frequencyHz)));
