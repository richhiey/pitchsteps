import type { ExerciseDefinition } from "../types/exercise";

export function SolfegeProgress({ exercise, activeIndex, completed }: { exercise: ExerciseDefinition; activeIndex: number | null; completed: number[] }) {
  return (
    <ol className="progress-row" aria-label="Scale progress">
      {exercise.steps.map((step) => {
        const state = activeIndex === step.index ? "current" : completed.includes(step.index) ? "completed" : "upcoming";
        return (
          <li className={`progress-row__item progress-row__item--${state}`} key={step.index}>
            <span>{step.target.solfege}</span>
            <small>{step.target.noteName}</small>
          </li>
        );
      })}
    </ol>
  );
}
