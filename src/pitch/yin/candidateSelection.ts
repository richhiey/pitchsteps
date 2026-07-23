import type { PitchCandidate } from "../../types/pitch";
import { parabolicInterpolation } from "./parabolicInterpolation";

export const selectYinCandidates = (
  normalized: Float32Array,
  sampleRate: number,
  minLag: number,
  maxLag: number,
  threshold: number
): PitchCandidate[] => {
  const candidates: PitchCandidate[] = [];
  for (let tau = minLag + 1; tau < maxLag - 1; tau += 1) {
    const value = normalized[tau];
    if (value < threshold && value <= normalized[tau - 1] && value <= normalized[tau + 1]) {
      const periodSamples = parabolicInterpolation(normalized, tau);
      candidates.push({
        frequencyHz: sampleRate / periodSamples,
        periodSamples,
        probability: Math.max(0, 1 - value),
        yinValue: value
      });
      while (tau + 1 < maxLag && normalized[tau + 1] < normalized[tau]) tau += 1;
    }
  }

  if (candidates.length > 0) return candidates.sort((a, b) => b.probability - a.probability);

  let bestTau = minLag;
  for (let tau = minLag + 1; tau <= maxLag; tau += 1) {
    if (normalized[tau] < normalized[bestTau]) bestTau = tau;
  }
  const bestValue = normalized[bestTau];
  if (bestValue > 0.35) return [];
  const periodSamples = parabolicInterpolation(normalized, bestTau);
  return [{ frequencyHz: sampleRate / periodSamples, periodSamples, probability: Math.max(0, 1 - bestValue), yinValue: bestValue }];
};
