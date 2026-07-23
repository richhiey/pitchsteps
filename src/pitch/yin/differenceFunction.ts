export const differenceFunction = (frame: Float32Array, maxLag: number): Float32Array => {
  const result = new Float32Array(maxLag + 1);
  for (let tau = 1; tau <= maxLag; tau += 1) {
    let sum = 0;
    const limit = frame.length - tau;
    for (let index = 0; index < limit; index += 1) {
      const delta = frame[index] - frame[index + tau];
      sum += delta * delta;
    }
    result[tau] = sum;
  }
  return result;
};
