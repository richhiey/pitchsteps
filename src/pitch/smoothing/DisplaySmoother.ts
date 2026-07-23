export class DisplaySmoother {
  private value: number | null = null;
  private lastVoicedAt = 0;

  constructor(private readonly alpha: number, private readonly holdMs = 150) {}

  reset(): void {
    this.value = null;
    this.lastVoicedAt = 0;
  }

  push(cents: number | null, timestampSeconds: number, voiced: boolean): number | null {
    if (voiced && cents !== null) {
      this.lastVoicedAt = timestampSeconds;
      this.value = this.value === null ? cents : this.alpha * cents + (1 - this.alpha) * this.value;
      return this.value;
    }
    if (this.value !== null && timestampSeconds - this.lastVoicedAt <= this.holdMs / 1000) return this.value;
    this.value = this.value === null ? null : this.value * 0.75;
    if (this.value !== null && Math.abs(this.value) < 1) this.value = null;
    return this.value;
  }
}
