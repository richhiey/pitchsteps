import type { ExerciseDefinition } from "../types/exercise";
import { beatDurationSeconds } from "../exercise/exerciseDefinition";

export class GuideToneScheduler {
  private nodes: AudioScheduledSourceNode[] = [];

  constructor(private readonly audioContext: AudioContext) {}

  stop(): void {
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {
        // Already stopped.
      }
    }
    this.nodes = [];
  }

  playTone(frequencyHz: number, startTime = this.audioContext.currentTime, volume = 0.35, duration = 0.19): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequencyHz, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startTime + 0.01);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), startTime + Math.max(0.02, duration - 0.05));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain).connect(this.audioContext.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
    this.nodes.push(osc);
  }

  scheduleCountInAndGuides(definition: ExerciseDefinition, exerciseStartTime: number, volume = 0.35): void {
    const beat = beatDurationSeconds(definition.bpm);
    for (let index = 0; index < definition.countInBeats; index += 1) {
      this.playClick(exerciseStartTime + index * beat, index === 0 ? 880 : 660);
    }
    const singingStart = exerciseStartTime + definition.countInBeats * beat;
    definition.steps.forEach((step) => {
      if (definition.guideToneMode === "each-note" || (definition.guideToneMode === "tonic-only" && step.index === 0)) {
        this.playTone(step.target.frequencyHz, singingStart + step.startTime, volume);
      }
    });
  }

  private playClick(startTime: number, frequencyHz: number): void {
    this.playTone(frequencyHz, startTime, 0.55, 0.06);
  }
}
