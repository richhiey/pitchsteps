import { SolfegeProgress } from "./SolfegeProgress";
import type { ExerciseDefinition } from "../types/exercise";

export function LandingScreen({ exercise }: { exercise: ExerciseDefinition }) {
  return (
    <main className="app-main app-main--welcome">
      <section className="welcome-card" aria-labelledby="intro-title">
        <div>
          <p className="eyebrow">A gentle daily reset</p>
          <h1 id="intro-title">Warm up your voice, one note at a time.</h1>
          <p>Follow the guide from Do to Do. You will see when your pitch is low, centred, or high—without sending your voice anywhere.</p>
        </div>
        <div className="welcome-card__scale">
          <span>Your eight-note warmup</span>
          <SolfegeProgress exercise={exercise} activeIndex={null} completed={[]} />
        </div>
      </section>
    </main>
  );
}
