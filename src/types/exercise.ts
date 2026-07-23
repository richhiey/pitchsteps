import type { SessionState } from "./session";

export type Solfege = "Do" | "Re" | "Mi" | "Fa" | "Sol" | "La" | "Ti";
export type GuideToneMode = "each-note" | "tonic-only" | "sustained" | "off";

export interface TargetNote {
  index: number;
  solfege: Solfege;
  midi: number;
  noteName: string;
  frequencyHz: number;
  scaleDegree: number;
}

export interface ExerciseStep {
  index: number;
  target: TargetNote;
  startTime: number;
  endTime: number;
  scoringStartTime: number;
  scoringEndTime: number;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  rootMidi: number;
  bpm: number;
  beatsPerNote: number;
  countInBeats: number;
  steps: ExerciseStep[];
  guideToneMode: GuideToneMode;
}

export interface ExerciseSession {
  id: string;
  definition: ExerciseDefinition;
  state: SessionState;
  scheduledStartTime: number | null;
  activeStepIndex: number | null;
  startedAt: number | null;
  completedAt: number | null;
  stoppedEarly: boolean;
}
