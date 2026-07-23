import type { PitchCandidate, VoicingResult } from "../../types/pitch";

export interface VoicingOptions {
  confidenceThreshold: number;
  voicedExitThreshold: number;
  minRmsDbfs: number;
  minFrequencyHz: number;
  maxFrequencyHz: number;
}

export class VoicingEstimator {
  private voiced = false;

  reset(): void {
    this.voiced = false;
  }

  estimate(candidate: PitchCandidate | null, confidence: number, rmsDbfs: number, clipped: boolean, options: VoicingOptions): VoicingResult {
    if (clipped) return this.set(false, 0, true, "clipping");
    if (rmsDbfs < options.minRmsDbfs) return this.set(false, 0, false, "low-level");
    if (!candidate) return this.set(false, 0.1, true, "no-candidate");
    if (candidate.frequencyHz < options.minFrequencyHz || candidate.frequencyHz > options.maxFrequencyHz) {
      return this.set(false, confidence, true, "out-of-range");
    }
    const threshold = this.voiced ? options.voicedExitThreshold : options.confidenceThreshold;
    if (confidence < threshold) return this.set(false, confidence, true, "low-confidence");
    return this.set(true, confidence, true, "voiced");
  }

  private set(voiced: boolean, probability: number, signalPresent: boolean, reason: VoicingResult["reason"]): VoicingResult {
    this.voiced = voiced;
    return { voiced, probability, signalPresent, reason };
  }
}
