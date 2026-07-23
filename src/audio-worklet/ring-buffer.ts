export class FloatRingBuffer {
  private writeIndex = 0;
  private filled = 0;
  private readonly buffer: Float32Array;

  constructor(size: number) {
    this.buffer = new Float32Array(size);
  }

  push(value: number): void {
    this.buffer[this.writeIndex] = value;
    this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
    this.filled = Math.min(this.filled + 1, this.buffer.length);
  }

  ready(): boolean {
    return this.filled === this.buffer.length;
  }

  flush(): Float32Array {
    const output = new Float32Array(this.filled);
    const start = (this.writeIndex - this.filled + this.buffer.length) % this.buffer.length;
    for (let index = 0; index < this.filled; index += 1) output[index] = this.buffer[(start + index) % this.buffer.length];
    this.filled = 0;
    this.writeIndex = 0;
    return output;
  }
}
