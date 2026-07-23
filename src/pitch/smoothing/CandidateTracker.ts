import { centsBetween } from "../conversion/cents";

export class CandidateTracker {
  private acceptedFrequency: number | null = null;
  private pendingFrequency: number | null = null;
  private pendingCount = 0;

  reset(): void {
    this.acceptedFrequency = null;
    this.pendingFrequency = null;
    this.pendingCount = 0;
  }

  accept(candidateFrequency: number | null): number | null {
    if (candidateFrequency === null) return this.acceptedFrequency;
    if (this.acceptedFrequency === null) {
      this.acceptedFrequency = candidateFrequency;
      return candidateFrequency;
    }

    const cents = Math.abs(centsBetween(candidateFrequency, this.acceptedFrequency));
    if (cents <= 700) {
      this.acceptedFrequency = candidateFrequency;
      this.pendingFrequency = null;
      this.pendingCount = 0;
      return candidateFrequency;
    }

    if (this.pendingFrequency !== null && Math.abs(centsBetween(candidateFrequency, this.pendingFrequency)) < 80) {
      this.pendingCount += 1;
    } else {
      this.pendingFrequency = candidateFrequency;
      this.pendingCount = 1;
    }

    if (this.pendingCount >= 3) {
      this.acceptedFrequency = candidateFrequency;
      this.pendingFrequency = null;
      this.pendingCount = 0;
    }
    return this.acceptedFrequency;
  }
}
