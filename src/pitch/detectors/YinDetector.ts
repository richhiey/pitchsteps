import type { DetectorConfiguration } from "../../types/pitch";
import { cumulativeMeanNormalizedDifference } from "../yin/cumulativeMean";
import { selectYinCandidates } from "../yin/candidateSelection";
import { differenceFunction } from "../yin/differenceFunction";
import type { DetectionResult, PitchDetector } from "./PitchDetector";

export class YinDetector implements PitchDetector {
  detect(frame: Float32Array, config: DetectorConfiguration): DetectionResult {
    const minLag = Math.max(2, Math.floor(config.analysisSampleRate / config.maxFrequencyHz));
    const maxLag = Math.min(frame.length - 2, Math.ceil(config.analysisSampleRate / config.minFrequencyHz));
    const difference = differenceFunction(frame, maxLag);
    const normalized = cumulativeMeanNormalizedDifference(difference);
    const candidates = selectYinCandidates(normalized, config.analysisSampleRate, minLag, maxLag, config.yinThreshold);
    const best = candidates[0];
    return {
      frequencyHz: best?.frequencyHz ?? null,
      confidence: best?.probability ?? 0,
      candidates
    };
  }
}
