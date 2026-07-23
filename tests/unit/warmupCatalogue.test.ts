import { describe, expect, it } from "vitest";
import { WARMUP_CATALOGUE } from "../../src/exercise/warmupCatalogue";

describe("warmup catalogue", () => {
  it("retains only exercises with more than two notes", () => {
    expect(WARMUP_CATALOGUE.length).toBeGreaterThan(0);
    expect(WARMUP_CATALOGUE.every((warmup) => warmup.expectedNotes.length > 2)).toBe(true);
    expect(WARMUP_CATALOGUE.map((warmup) => warmup.title)).not.toEqual(
      expect.arrayContaining(["Messa di Voce", "Slow and Steady", "Octave Slides", "The Superman"])
    );
  });
});
