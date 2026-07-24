import { Play, Volume2 } from "lucide-react";
import { NOTE_OPTIONS, midiToOctave, midiToNoteName } from "../pitch/conversion/midiToNote";
import { hasMicrophonePermission } from "../store/selectors";
import type { MicrophoneStatus } from "../types/session";
import type { PitchDetectorKind, PitchDetectorStatus } from "../types/pitch";

const NOTE_GROUPS = [3, 4, 5].map((octave) => ({
  octave,
  notes: NOTE_OPTIONS.filter((note) => midiToOctave(note.midi) === octave)
}));

interface PracticeControlsProps {
  microphoneStatus: MicrophoneStatus;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  rootMidi: number;
  bpm: number;
  guideVolume: number;
  detectorKind?: PitchDetectorKind;
  detectorStatus?: PitchDetectorStatus;
  detectorError?: string | null;
  canStart: boolean;
  locked: boolean;
  onDeviceChange: (deviceId: string) => void;
  onRequestMicrophone: () => void;
  onRootChange: (midi: number) => void;
  onBpmChange: (bpm: number) => void;
  onGuideVolumeChange: (volume: number) => void;
  onDetectorChange?: (detectorKind: PitchDetectorKind) => void;
  onPreview: () => void;
  onStart: () => void;
}

export function PracticeControls({
  microphoneStatus,
  devices,
  selectedDeviceId,
  rootMidi,
  bpm,
  guideVolume,
  detectorKind = "yin",
  detectorStatus = "idle",
  detectorError = null,
  canStart,
  locked,
  onDeviceChange,
  onRequestMicrophone,
  onRootChange,
  onBpmChange,
  onGuideVolumeChange,
  onDetectorChange = () => undefined,
  onPreview,
  onStart
}: PracticeControlsProps) {
  const hasDevices = devices.length > 0;
  const hasPermission = hasMicrophonePermission(microphoneStatus);
  const microphonePlaceholder = microphoneStatus === "requesting"
    ? "Requesting microphone…"
    : microphoneStatus === "denied"
      ? "Microphone permission denied"
      : microphoneStatus === "no-device"
        ? "No microphone detected"
        : "Allow microphone first";
  return (
    <div className="practice-controls">
      <section className="selector-bar" aria-label="Warmup controls">
        <label className="selector-field selector-field--note" htmlFor="starting-note">
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

        <button className="button button--secondary button--hear" onClick={onPreview}>
          <Volume2 aria-hidden="true" />
          Hear {midiToNoteName(rootMidi)}
        </button>

        <label className="selector-field selector-field--tempo" htmlFor="tempo">
          <span>Tempo</span>
          <div className="tempo-input">
            <input
              id="tempo"
              aria-label="Tempo"
              type="number"
              min="60"
              max="120"
              step="5"
              value={bpm}
              disabled={locked}
              onChange={(event) => onBpmChange(Math.min(120, Math.max(60, Number(event.target.value) || 60)))}
            />
            <span>BPM</span>
          </div>
        </label>

        <label className="selector-field" htmlFor="pitch-estimator">
          <span>Pitch estimator</span>
          <select
            id="pitch-estimator"
            value={detectorKind}
            disabled={locked}
            onChange={(event) => onDetectorChange(event.target.value as PitchDetectorKind)}
          >
            <option value="yin">YIN</option>
            <option value="swift-f0">swift-f0</option>
          </select>
          {detectorStatus === "loading" && <small>Loading model…</small>}
          {detectorStatus === "error" && <small role="alert">{detectorError ?? "Model unavailable"}</small>}
        </label>

        <label className="selector-field selector-field--microphone" htmlFor="microphone-device">
          <span>Microphone</span>
          <select
            id="microphone-device"
            value={hasPermission && hasDevices ? selectedDeviceId : ""}
            disabled={locked || !hasPermission || !hasDevices}
            onChange={(event) => onDeviceChange(event.target.value)}
          >
            {(!hasPermission || !hasDevices) && <option value="">{microphonePlaceholder}</option>}
            {hasPermission && devices.map((device, index) => (
              <option key={device.deviceId || index} value={device.deviceId}>
                {device.label || `Microphone ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
        {!hasPermission && (
          <button
            className="button button--secondary"
            type="button"
            onClick={onRequestMicrophone}
            disabled={locked || microphoneStatus === "requesting"}
          >
            {microphoneStatus === "requesting" ? "Waiting for permission…" : "Allow microphone"}
          </button>
        )}

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

        <button className="button button--primary button--start" onClick={onStart} disabled={locked || !canStart}>
          <Play aria-hidden="true" />
          Start
        </button>
      </section>

    </div>
  );
}
