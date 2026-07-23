import type { ExerciseStep } from "../types/exercise";

export function TargetNoteCard({ step, remaining }: { step: ExerciseStep; remaining: number }) {
  return (
    <section className="target-card" aria-label="Current target note">
      <span className="target-card__eyebrow">Target</span>
      <strong>{step.target.solfege}</strong>
      <span>{step.target.noteName}</span>
      <small>{step.target.frequencyHz.toFixed(1)} Hz</small>
      <div className="target-card__time">{remaining.toFixed(1)}s</div>
    </section>
  );
}
