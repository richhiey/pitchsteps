import { describe, expect, it } from "vitest";
import { YinDetector } from "../../src/pitch/detectors/YinDetector";
import { DEFAULT_DETECTOR_CONFIG } from "../../src/workers/workerProtocol";

const sine = (frequency: number, sampleRate = 16000, length = 1024): Float32Array => {
  const samples = new Float32Array(length);
  for (let index = 0; index < length; index += 1) samples[index] = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.6;
  return samples;
};

describe("YIN detector", () => {
  it("detects a clean sine wave", () => {
    const result = new YinDetector().detect(sine(261.6256), DEFAULT_DETECTOR_CONFIG);
    expect(result.frequencyHz).not.toBeNull();
    expect(result.frequencyHz as number).toBeCloseTo(261.6256, -0.5);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("rejects silence", () => {
    const result = new YinDetector().detect(new Float32Array(1024), DEFAULT_DETECTOR_CONFIG);
    expect(result.frequencyHz).toBeNull();
  });
});
