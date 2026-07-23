import * as ort from "onnxruntime-web/wasm";
import type { DetectorConfiguration, PitchCandidate } from "../../types/pitch";
import type { DetectionResult } from "./PitchDetector";

interface SwiftF0Outputs {
  pitch_hz: ort.Tensor;
  confidence: ort.Tensor;
}

export const mapSwiftF0Outputs = (
  pitches: ArrayLike<number>,
  confidences: ArrayLike<number>,
  config: DetectorConfiguration
): DetectionResult[] => Array.from(pitches, (frequencyHz, index) => {
  const confidence = confidences[index] ?? 0;
  const inRange = frequencyHz >= config.minFrequencyHz && frequencyHz <= config.maxFrequencyHz;
  const voiced = inRange && confidence >= config.confidenceThreshold;
  const candidate: PitchCandidate | null = voiced ? {
    frequencyHz,
    periodSamples: config.analysisSampleRate / frequencyHz,
    probability: confidence,
    yinValue: 1 - confidence
  } : null;
  return {
    frequencyHz: candidate?.frequencyHz ?? null,
    confidence,
    candidates: candidate ? [candidate] : []
  };
});

export const SWIFT_F0_HOP_SIZE = 256;
export const SWIFT_F0_MIN_SAMPLES = 256;
export const SWIFT_F0_WINDOW_SIZE = 4096;

export class SwiftF0Detector {
  private session: ort.InferenceSession | null = null;

  async load(): Promise<void> {
    if (this.session) return;
    ort.env.wasm.wasmPaths = { wasm: "/ort-wasm-simd-threaded.wasm" };
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    this.session = await ort.InferenceSession.create("/model.onnx", {
      executionProviders: ["wasm"]
    });
  }

  reset(): void {
    // The ONNX session is stateless; the worker owns the streaming buffer.
  }

  async detect(samples: Float32Array, config: DetectorConfiguration): Promise<DetectionResult[]> {
    await this.load();
    if (!this.session) throw new Error("SwiftF0 model is not ready.");

    const inputName = this.session.inputNames[0];
    const outputs = await this.session.run({
      [inputName]: new ort.Tensor("float32", samples, [1, samples.length])
    }) as unknown as SwiftF0Outputs;
    const pitches = Array.from(outputs.pitch_hz.data as Float32Array);
    const confidences = Array.from(outputs.confidence.data as Float32Array);

    return mapSwiftF0Outputs(pitches, confidences, config);
  }
}
