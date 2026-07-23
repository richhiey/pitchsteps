import { clamp } from "../utils/math";

export const MIN_DBFS = -100;

export const amplitudeToDbfs = (amplitude: number): number => {
  if (amplitude <= 0) return MIN_DBFS;
  return Math.max(MIN_DBFS, 20 * Math.log10(amplitude));
};

export const rms = (samples: Float32Array): number => {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
};

export const peak = (samples: Float32Array): number => {
  let max = 0;
  for (const sample of samples) max = Math.max(max, Math.abs(sample));
  return max;
};

export const classifyLevel = (rmsDbfs: number, peakValue: number): "no-input" | "too-quiet" | "usable" | "loud" | "clipping" => {
  if (peakValue >= 0.891) return "clipping";
  if (peakValue >= 0.501) return "loud";
  if (rmsDbfs < -60) return "no-input";
  if (rmsDbfs < -42) return "too-quiet";
  return "usable";
};

export const meterPercent = (rmsDbfs: number): number => clamp((rmsDbfs + 60) / 50, 0, 1);
