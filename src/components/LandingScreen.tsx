import { buildPitchTimelineModel } from "../visualization/pitchTimelineModel";
import type { ExerciseDefinition } from "../types/exercise";
import { PitchTimeline } from "./PitchTimeline";
import { WarmupSelector } from "./WarmupSelector";

interface LandingScreenProps {
  exercise: ExerciseDefinition;
  selectedWarmupTitle: string;
  onWarmupChange: (title: string) => void;
}

export function LandingScreen({ exercise, selectedWarmupTitle, onWarmupChange }: LandingScreenProps) {
  const model = buildPitchTimelineModel(exercise, [], 0);
  return (
    <main className="app-main app-main--exercise app-main--idle">
      <PitchTimeline exercise={exercise} activeStep={null} model={model} disabled />
      <WarmupSelector selectedWarmupTitle={selectedWarmupTitle} onWarmupChange={onWarmupChange} />
    </main>
  );
}
