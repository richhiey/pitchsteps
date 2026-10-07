import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../../src/store/appStore";
import { canStartExercise } from "../../src/store/selectors";

describe("app store calibration", () => {
  beforeEach(() => {
    useAppStore.setState({
      sessionState: "calibrating",
      microphoneStatus: "granted",
      calibrated: false,
      level: null
    });
  });

  it("advances to ready when a usable microphone level is detected", () => {
    useAppStore.getState().setLevel({
      sessionId: "test",
      timestamp: 0,
      rms: 0.08,
      peak: 0.2,
      rmsDbfs: -22,
      clipped: false
    });

    expect(useAppStore.getState().calibrated).toBe(true);
    expect(useAppStore.getState().microphoneStatus).toBe("ready");
    expect(useAppStore.getState().sessionState).toBe("ready");

    useAppStore.getState().dispatch("START_EXERCISE");
    expect(useAppStore.getState().sessionState).toBe("counting-in");
  });

  it("advances to ready when pitch calibration passes", () => {
    useAppStore.getState().setCalibrated(true);

    expect(useAppStore.getState().sessionState).toBe("ready");
  });

  it("starts with microphone permission before the user sings", () => {
    useAppStore.getState().setSelectedDeviceId("test-microphone");
    const state = useAppStore.getState();
    expect(canStartExercise(state.microphoneStatus, state.calibrated, state.level, state.selectedDeviceId)).toBe(true);
    state.dispatch("START_EXERCISE");
    expect(useAppStore.getState().sessionState).toBe("counting-in");
    state.setCalibrated(true);
    expect(useAppStore.getState().sessionState).toBe("counting-in");
    state.dispatch("COUNT_IN_FINISHED");
    expect(useAppStore.getState().sessionState).toBe("running");
  });

  it("rebuilds the warmup when the starting note or tempo changes", () => {
    useAppStore.getState().setRootMidi(55);
    useAppStore.getState().setBpm(105);

    const state = useAppStore.getState();
    expect(state.exercise.rootMidi).toBe(55);
    expect(state.exercise.bpm).toBe(105);
    expect(state.exercise.steps[0].target.noteName).toBe("G3");
    expect(state.exercise.steps).toHaveLength(8);
  });

  it("rebuilds the target sequence when the selected warm-up changes", () => {
    useAppStore.getState().setSelectedWarmupTitle("Trill to Vowel");

    const state = useAppStore.getState();
    expect(state.exercise.name).toBe("Trill to Vowel");
    expect(state.exercise.steps).toHaveLength(9);
    expect(state.exercise.steps[0].target.midi).toBe(state.rootMidi);
  });
});
