export const cumulativeMeanNormalizedDifference = (difference: Float32Array): Float32Array => {
  const normalized = new Float32Array(difference.length);
  normalized[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < difference.length; tau += 1) {
    runningSum += difference[tau];
    normalized[tau] = runningSum === 0 ? 1 : (difference[tau] * tau) / runningSum;
  }
  return normalized;
};
