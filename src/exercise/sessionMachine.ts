import type { SessionEvent, SessionState } from "../types/session";

const ANY_ACTIVE = new Set<SessionState>(["calibrating", "ready", "counting-in", "running", "paused"]);

export const transitionSession = (state: SessionState, event: SessionEvent): SessionState => {
  if (ANY_ACTIVE.has(state) && event === "DEVICE_LOST") return "error";
  if (ANY_ACTIVE.has(state) && event === "WORKER_FAILED") return "error";
  if (event === "AUDIO_CONTEXT_SUSPENDED" && state === "running") return "paused";

  const transitions: Partial<Record<SessionState, Partial<Record<SessionEvent, SessionState>>>> = {
    idle: { REQUEST_MICROPHONE: "requesting-microphone", START_EXERCISE: "counting-in", RESET: "idle" },
    "requesting-microphone": { MICROPHONE_GRANTED: "calibrating", MICROPHONE_DENIED: "error", RESET: "idle" },
    calibrating: { CALIBRATION_PASSED: "ready", CALIBRATION_FAILED: "calibrating", RESET: "idle" },
    ready: { START_EXERCISE: "counting-in", CALIBRATION_STARTED: "calibrating", STOP: "ready", RESET: "idle" },
    "counting-in": { COUNT_IN_FINISHED: "running", STOP: "ready", RESET: "ready" },
    running: { PAUSE: "paused", EXERCISE_FINISHED: "completed", STOP: "ready", RESET: "ready" },
    paused: { RESUME: "counting-in", STOP: "ready", RESET: "ready" },
    completed: { RETRY: "counting-in", RESET: "ready" },
    error: { RESET: "idle" }
  };

  return transitions[state]?.[event] ?? state;
};
