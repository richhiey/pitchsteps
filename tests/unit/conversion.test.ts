import { describe, expect, it } from "vitest";
import { centsBetween, centsFromNearestNote } from "../../src/pitch/conversion/cents";
import { frequencyToMidi, midiToFrequency, nearestMidi } from "../../src/pitch/conversion/frequencyToMidi";
import { midiToNoteName, parseNoteName } from "../../src/pitch/conversion/midiToNote";

describe("musical conversion", () => {
  it("converts A4 between frequency and MIDI", () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69, 6);
    expect(midiToFrequency(69)).toBeCloseTo(440, 6);
    expect(nearestMidi(441)).toBe(69);
  });

  it("formats scientific pitch names", () => {
    expect(midiToNoteName(60)).toBe("C4");
    expect(midiToNoteName(73)).toBe("C#5");
    expect(parseNoteName("C4")).toBe(60);
  });

  it("keeps target-relative cents unwrapped", () => {
    expect(centsBetween(880, 440)).toBeCloseTo(1200, 4);
    expect(centsFromNearestNote(440)).toBeCloseTo(0, 4);
  });
});
