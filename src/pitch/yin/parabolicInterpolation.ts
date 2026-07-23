export const parabolicInterpolation = (values: Float32Array, index: number): number => {
  if (index <= 0 || index >= values.length - 1) return index;
  const left = values[index - 1];
  const center = values[index];
  const right = values[index + 1];
  const denominator = left - 2 * center + right;
  if (Math.abs(denominator) < 1e-12) return index;
  return index + (left - right) / (2 * denominator);
};
