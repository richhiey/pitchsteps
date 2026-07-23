import { median } from "../../utils/math";

export class MedianPitchFilter {
  private values: number[] = [];

  constructor(private readonly windowSize: number) {}

  reset(): void {
    this.values = [];
  }

  push(frequencyHz: number | null): number | null {
    if (frequencyHz === null) return this.current();
    this.values.push(frequencyHz);
    while (this.values.length > this.windowSize) this.values.shift();
    return this.current();
  }

  current(): number | null {
    return median(this.values);
  }
}
