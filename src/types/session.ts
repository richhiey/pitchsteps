export type SessionState =
  | "idle"
  | "requesting-microphone"
  | "calibrating"
  | "ready"
  | "counting-in"
  | "running"
  | "paused"
  | "completed"
  | "error";

export type SessionEvent =
  | "REQUEST_MICROPHONE"
  | "MICROPHONE_GRANTED"
  | "MICROPHONE_DENIED"
  | "DEVICE_SELECTED"
  | "CALIBRATION_STARTED"
  | "CALIBRATION_PASSED"
  | "CALIBRATION_FAILED"
  | "START_EXERCISE"
  | "COUNT_IN_FINISHED"
  | "PAUSE"
  | "RESUME"
  | "STOP"
  | "EXERCISE_FINISHED"
  | "AUDIO_CONTEXT_SUSPENDED"
  | "AUDIO_CONTEXT_RESUMED"
  | "DEVICE_LOST"
  | "WORKER_FAILED"
  | "RESET"
  | "RETRY";

export type MicrophoneStatus =
  | "unknown"
  | "requesting"
  | "granted"
  | "denied"
  | "no-device"
  | "too-quiet"
  | "clipping"
  | "ready"
  | "lost"
  | "error";
