import type { ExerciseDefinition } from "../types/exercise";
import { buildPitchTimelineModel } from "../visualization/pitchTimelineModel";
import { PitchTimeline } from "./PitchTimeline";

export function CountIn({ beat, exercise, onStop }: { beat: number; exercise: ExerciseDefinition; onStop: () => void }) {
  const model = buildPitchTimelineModel(exercise, [], 0);
  return (
    <main className="app-main app-main--exercise app-main--count-in">
      <PitchTimeline exercise={exercise} activeStep={null} model={model} countInBeat={beat} />
      <button className="button button--ghost" onClick={onStop}>Stop</button>
    </main>
  );
}
