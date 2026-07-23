import { Headphones, Mic, Play, RefreshCw, Volume2 } from "lucide-react";
import { NOTE_OPTIONS, midiToOctave, midiToNoteName } from "../pitch/conversion/midiToNote";
import type { LevelFrame } from "../types/audio";
import type { MicrophoneStatus } from "../types/session";
import { InputMeter } from "./InputMeter";

const TEMPO_OPTIONS = Array.from({ length: 13 }, (_, index) => 60 + index * 5);
const NOTE_GROUPS = [3, 4, 5].map((octave) => ({
  octave,
  notes: NOTE_OPTIONS.filter((note) => midiToOctave(note.midi) === octave)
}));

interface PracticeControlsProps {
  microphoneStatus: MicrophoneStatus;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  level: LevelFrame | null;
  rootMidi: number;
  bpm: number;
  guideVolume: number;
  canStart: boolean;
  locked: boolean;
  onRequestMicrophone: () => void;
  onDeviceChange: (deviceId: string) => void;
  onRootChange: (midi: number) => void;
  onBpmChange: (bpm: number) => void;
  onGuideVolumeChange: (volume: number) => void;
  onPreview: () => void;
  onStart: () => void;
}

const readinessMessage = (
  status: MicrophoneStatus,
  canStart: boolean,
  hasDevices: boolean
): string => {
  if (canStart) return "Ready. Take an easy breath and begin when you are comfortable.";
  if (status === "requesting") return "Waiting for microphone permission…";
  if (status === "denied" || status === "error") return "Allow microphone access in your browser, then try again.";
  if (status === "no-device" || (status !== "unknown" && !hasDevices)) return "No microphone was found. Connect one and recheck.";
  if (status === "clipping") return "Your input is too loud. Move back slightly or lower the input level.";
  if (status === "too-quiet") return "Hum one comfortable note a little louder to complete the sound check.";
  if (hasDevices) return "Hum one comfortable note to complete the sound check.";
  return "Allow microphone access, then hum one comfortable note.";
};

export function PracticeControls({
  microphoneStatus,
  devices,
  selectedDeviceId,
  level,
  rootMidi,
  bpm,
  guideVolume,
  canStart,
  locked,
  onRequestMicrophone,
  onDeviceChange,
  onRootChange,
  onBpmChange,
  onGuideVolumeChange,
  onPreview,
  onStart
}: PracticeControlsProps) {
  const hasDevices = devices.length > 0;
  const hasPermission = microphoneStatus !== "unknown"
    && microphoneStatus !== "requesting"
    && microphoneStatus !== "denied"
    && hasDevices;
  const message = locked
    ? "Warmup in progress. Stop the session to change these settings."
    : readinessMessage(microphoneStatus, canStart, hasDevices);

  return (
    <div className="practice-controls">
      <section className="selector-bar" aria-labelledby="warmup-settings-heading">
        <div className="selector-bar__title">
          <Headphones aria-hidden="true" />
          <div>
            <h2 id="warmup-settings-heading">Set your warmup</h2>
            <span>Ascending major scale · two beats per note</span>
          </div>
        </div>

        <label className="selector-field" htmlFor="starting-note">
          <span>Starting note</span>
          <select
            id="starting-note"
            value={rootMidi}
            disabled={locked}
            onChange={(event) => onRootChange(Number(event.target.value))}
          >
            {NOTE_GROUPS.map((group) => (
              <optgroup key={group.octave} label={`Octave ${group.octave}`}>
                {group.notes.map((note) => (
                  <option key={note.midi} value={note.midi}>{note.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="selector-field" htmlFor="tempo">
          <span>Tempo</span>
          <select
            id="tempo"
            value={bpm}
            disabled={locked}
            onChange={(event) => onBpmChange(Number(event.target.value))}
          >
            {TEMPO_OPTIONS.map((tempo) => (
              <option key={tempo} value={tempo}>{tempo} BPM</option>
            ))}
          </select>
        </label>

        <label className="selector-field selector-field--microphone" htmlFor="microphone-device">
          <span>Microphone</span>
          <select
            id="microphone-device"
            value={hasDevices ? selectedDeviceId : ""}
            disabled={locked || !hasDevices}
            onChange={(event) => onDeviceChange(event.target.value)}
          >
            {!hasDevices && <option value="">Allow microphone first</option>}
            {devices.map((device, index) => (
              <option key={device.deviceId || index} value={device.deviceId}>
                {device.label || `Microphone ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="readiness-panel" aria-labelledby="sound-check-heading">
        <div className="readiness-panel__status">
          <div className="sound-check-heading">
            <span className={`status-dot${canStart ? " status-dot--ready" : ""}`} aria-hidden="true" />
            <div>
              <h2 id="sound-check-heading">{canStart ? "Sound check complete" : "Quick sound check"}</h2>
              <p aria-live="polite">{message}</p>
            </div>
          </div>
          <InputMeter level={level} />
        </div>

        <div className="guide-control">
          <label htmlFor="guide-volume">
            <Volume2 aria-hidden="true" />
            <span>Guide volume</span>
            <strong>{Math.round(guideVolume * 100)}%</strong>
          </label>
          <input
            id="guide-volume"
            aria-label="Guide volume"
            type="range"
            min="0"
            max="0.8"
            step="0.05"
            value={guideVolume}
            disabled={locked}
            onChange={(event) => onGuideVolumeChange(Number(event.target.value))}
          />
        </div>

        <div className="readiness-panel__actions">
          {!hasPermission ? (
            <button
              className="button button--secondary"
              onClick={onRequestMicrophone}
              disabled={locked || microphoneStatus === "requesting"}
            >
              <Mic aria-hidden="true" />
              {microphoneStatus === "requesting" ? "Waiting…" : "Allow microphone"}
            </button>
          ) : (
            <button className="button button--secondary" onClick={onRequestMicrophone} disabled={locked}>
              <RefreshCw aria-hidden="true" />
              Recheck
            </button>
          )}
          <button className="button button--secondary" onClick={onPreview} disabled={locked || !hasPermission}>
            <Volume2 aria-hidden="true" />
            Hear {midiToNoteName(rootMidi)}
          </button>
          <button className="button button--primary button--start" onClick={onStart} disabled={locked || !canStart}>
            <Play aria-hidden="true" />
            Start warmup
          </button>
        </div>
      </section>
    </div>
  );
}
