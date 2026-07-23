import { describe, expect, it } from "vitest";
import { mapSwiftF0Outputs } from "../../src/pitch/detectors/SwiftF0Detector";
import { DEFAULT_DETECTOR_CONFIG } from "../../src/workers/workerProtocol";

describe("swift-f0 output mapping", () => {
  it("maps voiced model output to the shared candidate shape", () => {
    const result = mapSwiftF0Outputs([261.6256], [0.97], DEFAULT_DETECTOR_CONFIG)[0];

    expect(result.frequencyHz).toBeCloseTo(261.6256);
    expect(result.confidence).toBe(0.97);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].periodSamples).toBeCloseTo(16000 / 261.6256);
  });

  it("marks low-confidence and out-of-range output unvoiced", () => {
    const result = mapSwiftF0Outputs([60, 1200], [0.95, 0.95], DEFAULT_DETECTOR_CONFIG);

    expect(result[0].frequencyHz).toBeNull();
    expect(result[0].candidates).toHaveLength(0);
    expect(result[1].frequencyHz).toBeNull();
    expect(result[1].candidates).toHaveLength(0);
  });
});
