import { useEffect, useMemo, useRef, useState } from "react";
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
import { AboutModal } from "./components/AboutModal";

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
  const [aboutOpen, setAboutOpen] = useState(false);

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
      onDetectorStatus: store.setDetectorStatus,
      onError: (message) => {
        store.setError(message);
        if (useAppStore.getState().detectorKind === "swift-f0") {
          store.setDetectorError(message);
          return;
        }
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
    engineRef.current?.setDetector(store.detectorKind);
  }, [store.detectorKind]);

  useEffect(() => {
    const activeTarget = clockSnapshot?.activeStep?.target ?? null;
    engineRef.current?.setTarget(activeTarget?.midi ?? null, activeTarget?.frequencyHz ?? null);
  }, [clockSnapshot?.activeStep?.target.midi]);

  const requestMicrophone = async (deviceId = store.selectedDeviceId) => {
    try {
      store.setMicrophoneStatus("requesting");
      const sessionId = store.newSession();
      const stream = await microphoneManager.request(deviceId || undefined);
      const devices = microphoneManager.devices;
      store.setDevices(devices);
      store.setSelectedDeviceId(deviceId || devices[0]?.deviceId || "");
      await engineRef.current?.initialize(stream, sessionId, store.detectorKind);
      await engineRef.current?.resume();
      store.setMicrophoneStatus(devices.length > 0 ? "granted" : "no-device");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Microphone access is blocked or unavailable.";
      store.setError(message);
      store.setDevices([]);
      store.setSelectedDeviceId("");
      store.setMicrophoneStatus("denied");
    }
  };

  const allowMicrophone = async () => {
    try {
      store.setMicrophoneStatus("requesting");
      const stream = await microphoneManager.request();
      const devices = microphoneManager.devices;
      microphoneManager.stop();
      store.setDevices(devices);
      store.setSelectedDeviceId(devices[0]?.deviceId ?? "");
      store.setMicrophoneStatus(devices.length > 0 ? "granted" : "no-device");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Microphone access is blocked or unavailable.";
      store.setError(message);
      store.setDevices([]);
      store.setSelectedDeviceId("");
      store.setMicrophoneStatus("denied");
    }
  };

  const stopAudioCapture = () => {
    microphoneManager.stop();
    void engineRef.current?.cleanup(false);
  };

  const startExercise = async () => {
    const hasLiveInput = microphoneManager.stream?.getAudioTracks().some((track) => track.readyState === "live") ?? false;
    if (!engineRef.current?.audioContext || !hasLiveInput) {
      await requestMicrophone(store.selectedDeviceId);
    }
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

  const completeSession = async (sessionId: string, result: ReturnType<typeof scoreSession>) => {
    if (recorderRef.current.isRecording) {
      setRecordingStatus("processing");
      const blob = await recorderRef.current.stop();
      if (blob && useAppStore.getState().sessionId === sessionId) {
        const url = URL.createObjectURL(blob);
        recordingUrlRef.current = url;
        setRecordingUrl(url);
        setRecordingStatus("ready");
      } else if (useAppStore.getState().sessionId === sessionId) {
        setRecordingStatus("unavailable");
      }
    }
    stopAudioCapture();
    if (useAppStore.getState().sessionId !== sessionId) return;
    store.setResult(result);
    store.dispatch("EXERCISE_FINISHED");
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
        void completeSession(sessionId, result);
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
    stopAudioCapture();
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
        <button className="brand" type="button" onClick={() => setAboutOpen(true)} aria-label="Open about pitchsteps">
          <span className="brand__mark"><AudioLines aria-hidden="true" /></span>
          <div>
            <span>pitchsteps</span>
            <small>A clearer start for your voice.</small>
          </div>
        </button>
      </header>
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      <PracticeControls
        microphoneStatus={store.microphoneStatus}
        devices={store.devices}
        selectedDeviceId={store.selectedDeviceId}
        rootMidi={store.rootMidi}
        bpm={store.bpm}
        guideVolume={store.guideVolume}
        detectorKind={store.detectorKind}
        detectorStatus={store.detectorStatus}
        detectorError={store.detectorError}
        canStart={startEnabled}
        locked={controlsLocked}
        onDeviceChange={store.setSelectedDeviceId}
        onRequestMicrophone={() => void allowMicrophone()}
        onRootChange={store.setRootMidi}
        onBpmChange={store.setBpm}
        onGuideVolumeChange={store.setGuideVolume}
        onDetectorChange={store.setDetectorKind}
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
        <LandingScreen
          exercise={store.exercise}
          selectedWarmupTitle={store.selectedWarmupTitle}
          onWarmupChange={store.setSelectedWarmupTitle}
        />
      )}
      <span className="sr-only" aria-live="polite">
        {store.latestPitch?.noteName ? `Detected ${store.latestPitch.noteName}` : "Listening for pitch"}
      </span>
      <footer className="site-footer">
        Audio stays on this device • © 2026 Richhiey Thomas
      </footer>
    </div>
  );
}
import { AudioLines } from "lucide-react";
