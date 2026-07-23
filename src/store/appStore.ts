import { create } from "zustand";
import { buildExerciseDefinition } from "../exercise/scaleBuilder";
import type { ExerciseDefinition } from "../types/exercise";
import type { LevelFrame } from "../types/audio";
import type { PitchFrame } from "../types/pitch";
import type { SessionResult } from "../types/scoring";
import type { MicrophoneStatus, SessionEvent, SessionState } from "../types/session";
import { transitionSession } from "../exercise/sessionMachine";

interface AppState {
  sessionId: string;
  sessionState: SessionState;
  microphoneStatus: MicrophoneStatus;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  rootMidi: number;
  bpm: number;
  guideVolume: number;
  countInVolume: number;
  exercise: ExerciseDefinition;
  level: LevelFrame | null;
  latestPitch: PitchFrame | null;
  pitchFrames: PitchFrame[];
  result: SessionResult | null;
  errorMessage: string | null;
  calibrated: boolean;
  dispatch: (event: SessionEvent) => void;
  newSession: () => string;
  setDevices: (devices: MediaDeviceInfo[]) => void;
  setSelectedDeviceId: (deviceId: string) => void;
  setRootMidi: (midi: number) => void;
  setBpm: (bpm: number) => void;
  setGuideVolume: (volume: number) => void;
  setLevel: (level: LevelFrame) => void;
  setPitchFrame: (frame: PitchFrame) => void;
  clearFrames: () => void;
  setMicrophoneStatus: (status: MicrophoneStatus) => void;
  setResult: (result: SessionResult | null) => void;
  setError: (message: string | null) => void;
  setCalibrated: (calibrated: boolean) => void;
}

const randomId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const useAppStore = create<AppState>((set) => ({
  sessionId: randomId(),
  sessionState: "idle",
  microphoneStatus: "unknown",
  devices: [],
  selectedDeviceId: "",
  rootMidi: 60,
  bpm: 90,
  guideVolume: 0.35,
  countInVolume: 0.55,
  exercise: buildExerciseDefinition(),
  level: null,
  latestPitch: null,
  pitchFrames: [],
  result: null,
  errorMessage: null,
  calibrated: false,
  dispatch: (event) => set((state) => ({ sessionState: transitionSession(state.sessionState, event) })),
  newSession: () => {
    const sessionId = randomId();
    set({ sessionId, pitchFrames: [], latestPitch: null, result: null });
    return sessionId;
  },
  setDevices: (devices) => set({ devices }),
  setSelectedDeviceId: (selectedDeviceId) => set({ selectedDeviceId, calibrated: false }),
  setRootMidi: (rootMidi) => set((state) => ({ rootMidi, exercise: buildExerciseDefinition({ rootMidi, bpm: state.bpm }) })),
  setBpm: (bpm) => set((state) => ({ bpm, exercise: buildExerciseDefinition({ rootMidi: state.rootMidi, bpm }) })),
  setGuideVolume: (guideVolume) => set({ guideVolume }),
  setLevel: (level) => {
    const usable = level.rmsDbfs > -42 && level.rmsDbfs < -10 && !level.clipped;
    set((state) => ({
      level,
      microphoneStatus: level.clipped ? "clipping" : usable ? "ready" : level.rmsDbfs < -60 ? "too-quiet" : state.microphoneStatus,
      calibrated: usable || state.calibrated,
      sessionState: usable && state.sessionState === "calibrating"
        ? transitionSession(state.sessionState, "CALIBRATION_PASSED")
        : state.sessionState
    }));
  },
  setPitchFrame: (frame) => set((state) => ({ latestPitch: frame, pitchFrames: [...state.pitchFrames.slice(-1800), frame] })),
  clearFrames: () => set({ pitchFrames: [], latestPitch: null }),
  setMicrophoneStatus: (microphoneStatus) => set({ microphoneStatus }),
  setResult: (result) => set({ result }),
  setError: (errorMessage) => set({ errorMessage }),
  setCalibrated: (calibrated) => set((state) => ({
    calibrated,
    sessionState: calibrated && state.sessionState === "calibrating"
      ? transitionSession(state.sessionState, "CALIBRATION_PASSED")
      : state.sessionState
  }))
}));
