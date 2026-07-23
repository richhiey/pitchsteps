import { amplitudeToDbfs } from "../audio/levelAnalysis";
import type { MicrophoneProcessorOptions, WorkletMessage } from "./worklet-messages";

class MicrophoneProcessor extends AudioWorkletProcessor {
  private readonly sessionId: string;
  private readonly batch: Float32Array;
  private writeIndex = 0;
  private clipBlocks = 0;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const processorOptions = (options?.processorOptions ?? {}) as MicrophoneProcessorOptions;
    this.sessionId = processorOptions.sessionId;
    this.batch = new Float32Array(processorOptions.batchSize || 2048);
  }

  process(inputs: Float32Array[][]): boolean {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channelCount = input.length;
    const frames = input[0].length;
    let sumSquares = 0;
    let peak = 0;

    for (let frame = 0; frame < frames; frame += 1) {
      let mono = 0;
      for (let channel = 0; channel < channelCount; channel += 1) mono += input[channel][frame] ?? 0;
      mono /= channelCount;
      sumSquares += mono * mono;
      peak = Math.max(peak, Math.abs(mono));
      this.batch[this.writeIndex] = mono;
      this.writeIndex += 1;
      if (this.writeIndex >= this.batch.length) {
        const samples = this.batch.slice();
        this.port.postMessage({ type: "samples", sessionId: this.sessionId, timestamp: currentTime, samples } satisfies WorkletMessage, [
          samples.buffer
        ]);
        this.writeIndex = 0;
      }
    }

    this.clipBlocks = peak >= 0.985 ? this.clipBlocks + 1 : Math.max(0, this.clipBlocks - 1);
    const rms = Math.sqrt(sumSquares / Math.max(1, frames));
    this.port.postMessage({
      type: "level",
      sessionId: this.sessionId,
      timestamp: currentTime,
      rms,
      peak,
      rmsDbfs: amplitudeToDbfs(rms),
      clipped: this.clipBlocks >= 3
    } satisfies WorkletMessage);
    return true;
  }
}

registerProcessor("microphone-processor", MicrophoneProcessor);
