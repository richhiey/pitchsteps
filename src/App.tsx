import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines } from "lucide-react";
import { AudioEngine } from "./audio/AudioEngine";
import { MicrophoneManager } from "./audio/MicrophoneManager";
import { SessionRecorder } from "./audio/SessionRecorder";
import { beatDurationSeconds } from "./exercise/exerciseDefinition";
import { getExerciseSnapshot } from "./exercise/ExerciseClock";
import { midiToFrequency } from "./pitch/conversion/frequencyToMidi";
import { scoreSession } from "./scoring/SessionScorer";
import { canStartExercise } from "./store/selectors";
import { useAppStore } from "./store/appStore";
import type { ExerciseClockSnapshot } from "./exercise/ExerciseClock";
import { CountIn } from "./components/CountIn";
import { ErrorPanel } from "./components/ErrorPanel";
import { ExerciseScreen } from "./components/ExerciseScreen";
import { LandingScreen } from "./components/LandingScreen";
import { PracticeControls } from "./components/PracticeControls";
import { ResultsScreen } from "./components/ResultsScreen";

const microphoneManager = new MicrophoneManager();

export function App() {
  const store = useAppStore();
  const engineRef = useRef<AudioEngine | null>(null);
  const recorderRef = useRef(new SessionRecorder());
  const animationRef = useRef<number | null>(null);
  const scheduledStartRef = useRef<number | null>(null);
  const recordingUrlRef = useRef<string | null>(null);
  const [clockSnapshot, setClockSnapshot] = useState<ExerciseClockSnapshot | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "processing" | "ready" | "unavailable">("idle");

  const startEnabled = useMemo(
    () => canStartExercise(store.microphoneStatus, store.calibrated, store.level, store.selectedDeviceId),
    [store.microphoneStatus, store.calibrated, store.level, store.selectedDeviceId]
  );

  useEffect(() => {
    engineRef.current = new AudioEngine({
      onLevel: store.setLevel,
      onPitchFrame: (frame) => {
        const scheduledStart = scheduledStartRef.current;
        const countInDuration = store.exercise.countInBeats * beatDurationSeconds(store.exercise.bpm);
        const relativeFrame = scheduledStart === null ? frame : { ...frame, timestamp: frame.timestamp - scheduledStart - countInDuration };
        store.setPitchFrame(relativeFrame);
        if (relativeFrame.voiced && relativeFrame.confidence >= 0.65 && !relativeFrame.clipped) store.setCalibrated(true);
      },
      onError: (message) => {
        store.setError(message);
        store.dispatch("WORKER_FAILED");
      }
    });
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
      void recorderRef.current.stop();
      void engineRef.current?.cleanup();
      microphoneManager.stop();
    };
  }, []);

  useEffect(() => {
    const activeTarget = clockSnapshot?.activeStep?.target ?? null;
    engineRef.current?.setTarget(activeTarget?.midi ?? null, activeTarget?.frequencyHz ?? null);
  }, [clockSnapshot?.activeStep?.target.midi]);

  const requestMicrophone = async (deviceId = store.selectedDeviceId) => {
    try {
      store.dispatch("REQUEST_MICROPHONE");
      store.setMicrophoneStatus("requesting");
      const sessionId = store.newSession();
      const stream = await microphoneManager.request(deviceId || undefined);
      const devices = microphoneManager.devices;
      store.setDevices(devices);
      store.setSelectedDeviceId(deviceId || devices[0]?.deviceId || "");
      await engineRef.current?.initialize(stream, sessionId);
      await engineRef.current?.resume();
      store.setMicrophoneStatus(devices.length > 0 ? "granted" : "no-device");
      store.dispatch("MICROPHONE_GRANTED");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Microphone access is blocked or unavailable.";
      store.setError(message);
      store.setMicrophoneStatus("denied");
      store.dispatch("MICROPHONE_DENIED");
    }
  };

  const startExercise = async () => {
    if (!engineRef.current?.audioContext) return;
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
      recordingUrlRef.current = null;
    }
    setRecordingUrl(null);
    setRecordingStatus("idle");
    const sessionId = store.newSession();
    scheduledStartRef.current = engineRef.current.audioContext.currentTime + 0.08;
    store.clearFrames();
    store.dispatch(store.sessionState === "completed" ? "RETRY" : "START_EXERCISE");
    await engineRef.current.resume();
    engineRef.current.guideToneScheduler?.scheduleCountInAndGuides(store.exercise, scheduledStartRef.current, store.guideVolume);
    runClock(sessionId);
  };

  const runClock = (sessionId: string) => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    const tick = () => {
      const engine = engineRef.current;
      const scheduledStart = scheduledStartRef.current;
      if (!engine?.audioContext || scheduledStart === null || useAppStore.getState().sessionId !== sessionId) return;
      const snapshot = getExerciseSnapshot(store.exercise, engine.audioContext.currentTime, scheduledStart);
      setClockSnapshot(snapshot);
      if (snapshot.phase === "running" && useAppStore.getState().sessionState === "counting-in") {
        store.dispatch("COUNT_IN_FINISHED");
        const stream = microphoneManager.stream;
        setRecordingStatus(stream && recorderRef.current.start(stream) ? "recording" : "unavailable");
      }
      if (snapshot.phase === "complete") {
        const result = scoreSession(sessionId, store.exercise, useAppStore.getState().pitchFrames);
        if (recorderRef.current.isRecording) {
          setRecordingStatus("processing");
          void recorderRef.current.stop().then((blob) => {
            if (!blob || useAppStore.getState().sessionId !== sessionId) {
              setRecordingStatus(blob ? "idle" : "unavailable");
              return;
            }
            const url = URL.createObjectURL(blob);
            recordingUrlRef.current = url;
            setRecordingUrl(url);
            setRecordingStatus("ready");
          });
        }
        store.setResult(result);
        store.dispatch("EXERCISE_FINISHED");
        engine.guideToneScheduler?.playTone(midiToFrequency(store.rootMidi + 12), engine.audioContext.currentTime, 0.25, 0.12);
        return;
      }
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
  };

  const stopExercise = () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    scheduledStartRef.current = null;
    setClockSnapshot(null);
    void recorderRef.current.stop();
    setRecordingStatus("idle");
    engineRef.current?.guideToneScheduler?.stop();
    store.dispatch("STOP");
  };

  const replayScale = () => {
    const engine = engineRef.current;
    if (!engine?.audioContext) return;
    let time = engine.audioContext.currentTime + 0.05;
    store.exercise.steps.forEach((step) => {
      engine.guideToneScheduler?.playTone(step.target.frequencyHz, time, store.guideVolume, 0.18);
      time += 0.22;
    });
  };

  const activeStep = clockSnapshot?.activeStep ?? null;
  const exerciseElapsed = clockSnapshot
    ? Math.max(0, clockSnapshot.elapsed - store.exercise.countInBeats * beatDurationSeconds(store.exercise.bpm))
    : 0;
  const controlsLocked = store.sessionState === "counting-in" || store.sessionState === "running";

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand__mark"><AudioLines aria-hidden="true" /></span>
          <div>
            <span>vocalwarmup</span>
            <small>A clearer start for your voice.</small>
          </div>
        </div>
        <span className="privacy-pill">Audio stays on this device</span>
      </header>
      <PracticeControls
        microphoneStatus={store.microphoneStatus}
        devices={store.devices}
        selectedDeviceId={store.selectedDeviceId}
        level={store.level}
        rootMidi={store.rootMidi}
        bpm={store.bpm}
        guideVolume={store.guideVolume}
        canStart={startEnabled}
        locked={controlsLocked}
        onRequestMicrophone={() => requestMicrophone()}
        onDeviceChange={(deviceId) => requestMicrophone(deviceId)}
        onRootChange={store.setRootMidi}
        onBpmChange={store.setBpm}
        onGuideVolumeChange={store.setGuideVolume}
        onPreview={() => engineRef.current?.guideToneScheduler?.playTone(midiToFrequency(store.rootMidi), undefined, store.guideVolume)}
        onStart={startExercise}
      />
      {store.sessionState === "error" ? (
        <ErrorPanel message={store.errorMessage ?? "The audio device is unavailable."} onReset={() => store.dispatch("RESET")} />
      ) : store.sessionState === "counting-in" ? (
        <CountIn beat={clockSnapshot?.countInBeat ?? 1} exercise={store.exercise} onStop={stopExercise} />
      ) : store.sessionState === "running" && activeStep ? (
        <ExerciseScreen
          exercise={store.exercise}
          step={activeStep}
          remaining={clockSnapshot?.remainingInStep ?? 0}
          elapsed={exerciseElapsed}
          latestPitch={store.latestPitch}
          pitchFrames={store.pitchFrames}
          level={store.level}
          onStop={stopExercise}
        />
      ) : store.sessionState === "completed" && store.result ? (
        <ResultsScreen
          result={store.result}
          exercise={store.exercise}
          pitchFrames={store.pitchFrames}
          recordingUrl={recordingUrl}
          recordingStatus={recordingStatus}
          onRetry={startExercise}
          onChange={() => store.dispatch("RESET")}
          onReplay={replayScale}
        />
      ) : (
        <LandingScreen exercise={store.exercise} />
      )}
      <span className="sr-only" aria-live="polite">
        {store.latestPitch?.noteName ? `Detected ${store.latestPitch.noteName}` : "Listening for pitch"}
      </span>
    </div>
  );
}
