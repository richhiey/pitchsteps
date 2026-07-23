import type { ExerciseDefinition } from "../types/exercise";
import { SolfegeProgress } from "./SolfegeProgress";

export function CountIn({ beat, exercise, onStop }: { beat: number; exercise: ExerciseDefinition; onStop: () => void }) {
  const first = exercise.steps[0].target;
  return (
    <main className="app-main app-main--focus">
      <section className="count-in" aria-live="polite">
        <span className="count-in__number">{beat}</span>
        <p>First note: {first.solfege} · {first.noteName}</p>
      </section>
      <SolfegeProgress exercise={exercise} activeIndex={null} completed={[]} />
      <button className="button button--ghost" onClick={onStop}>Stop</button>
    </main>
  );
}
