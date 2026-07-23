import { create } from "zustand";
import { buildWarmupExerciseDefinition } from "../exercise/scaleBuilder";
import { WARMUP_CATALOGUE } from "../exercise/warmupCatalogue";
import type { ExerciseDefinition } from "../types/exercise";
import type { LevelFrame } from "../types/audio";
import type { PitchDetectorKind, PitchDetectorStatus, PitchFrame } from "../types/pitch";
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
  selectedWarmupTitle: string;
  bpm: number;
  guideVolume: number;
  countInVolume: number;
  detectorKind: PitchDetectorKind;
  detectorStatus: PitchDetectorStatus;
  detectorError: string | null;
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
  setSelectedWarmupTitle: (title: string) => void;
  setBpm: (bpm: number) => void;
  setGuideVolume: (volume: number) => void;
  setLevel: (level: LevelFrame) => void;
  setPitchFrame: (frame: PitchFrame) => void;
  setDetectorKind: (detectorKind: PitchDetectorKind) => void;
  setDetectorStatus: (status: PitchDetectorStatus) => void;
  setDetectorError: (message: string | null) => void;
  clearFrames: () => void;
  setMicrophoneStatus: (status: MicrophoneStatus) => void;
  setResult: (result: SessionResult | null) => void;
  setError: (message: string | null) => void;
  setCalibrated: (calibrated: boolean) => void;
}

const randomId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const storedDetectorKind = (): PitchDetectorKind => {
  if (typeof localStorage === "undefined" || typeof localStorage.getItem !== "function") return "yin";
  return localStorage.getItem("pitchsteps-detector") === "swift-f0" ? "swift-f0" : "yin";
};

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
  detectorKind: storedDetectorKind(),
  detectorStatus: "idle",
  detectorError: null,
  selectedWarmupTitle: WARMUP_CATALOGUE[0].title,
  exercise: buildWarmupExerciseDefinition(WARMUP_CATALOGUE[0]),
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
  setRootMidi: (rootMidi) => set((state) => {
    const warmup = WARMUP_CATALOGUE.find(({ title }) => title === state.selectedWarmupTitle) ?? WARMUP_CATALOGUE[0];
    return { rootMidi, exercise: buildWarmupExerciseDefinition(warmup, { rootMidi, bpm: state.bpm }) };
  }),
  setSelectedWarmupTitle: (selectedWarmupTitle) => set((state) => {
    const warmup = WARMUP_CATALOGUE.find(({ title }) => title === selectedWarmupTitle) ?? WARMUP_CATALOGUE[0];
    return { selectedWarmupTitle: warmup.title, exercise: buildWarmupExerciseDefinition(warmup, { rootMidi: state.rootMidi, bpm: state.bpm }) };
  }),
  setBpm: (bpm) => set((state) => {
    const warmup = WARMUP_CATALOGUE.find(({ title }) => title === state.selectedWarmupTitle) ?? WARMUP_CATALOGUE[0];
    return { bpm, exercise: buildWarmupExerciseDefinition(warmup, { rootMidi: state.rootMidi, bpm }) };
  }),
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
  setDetectorKind: (detectorKind) => {
    if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") localStorage.setItem("pitchsteps-detector", detectorKind);
    set({ detectorKind, detectorStatus: "idle", detectorError: null, calibrated: false, pitchFrames: [], latestPitch: null });
  },
  setDetectorStatus: (detectorStatus) => set({ detectorStatus, detectorError: detectorStatus === "error" ? "SwiftF0 could not be loaded." : null }),
  setDetectorError: (detectorError) => set({ detectorError, detectorStatus: detectorError ? "error" : "idle" }),
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
