import { clamp } from "../utils/math";

const mapSegment = (value: number, fromA: number, fromB: number, toA: number, toB: number): number => {
  const t = clamp((value - fromA) / (fromB - fromA), 0, 1);
  return toA + (toB - toA) * t;
};

export const pitchFrameScore = (absoluteCents: number): number => {
  if (absoluteCents <= 10) return 100;
  if (absoluteCents <= 20) return mapSegment(absoluteCents, 10, 20, 100, 85);
  if (absoluteCents <= 50) return mapSegment(absoluteCents, 20, 50, 85, 45);
  if (absoluteCents <= 100) return mapSegment(absoluteCents, 50, 100, 45, 0);
  return 0;
};

export const stabilityScoreFromVariation = (variationCents: number): number => {
  if (variationCents <= 10) return 100;
  if (variationCents <= 25) return mapSegment(variationCents, 10, 25, 100, 75);
  if (variationCents <= 50) return mapSegment(variationCents, 25, 50, 75, 35);
  return clamp(mapSegment(variationCents, 50, 100, 35, 0), 0, 35);
};

export const voicedCoverageScore = (coverage: number): number => {
  if (coverage >= 0.9) return 100;
  if (coverage >= 0.6) return mapSegment(coverage, 0.6, 0.9, 60, 100);
  if (coverage >= 0.3) return mapSegment(coverage, 0.3, 0.6, 20, 60);
  return mapSegment(coverage, 0, 0.3, 0, 20);
};
