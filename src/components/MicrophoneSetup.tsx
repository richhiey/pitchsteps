import { Mic, RefreshCw } from "lucide-react";
import type { LevelFrame } from "../types/audio";
import { InputMeter } from "./InputMeter";

interface MicrophoneSetupProps {
  status: string;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  level: LevelFrame | null;
  onRequest: () => void;
  onDeviceChange: (deviceId: string) => void;
}

export function MicrophoneSetup({ status, devices, selectedDeviceId, level, onRequest, onDeviceChange }: MicrophoneSetupProps) {
  const hasPermission = status !== "unknown" && status !== "requesting" && status !== "denied" && devices.length > 0;
  return (
    <section className="panel" aria-labelledby="microphone-heading">
      <div className="panel__heading">
        <Mic aria-hidden="true" />
        <div>
          <h2 id="microphone-heading">Microphone</h2>
          <p>Your voice is analysed and recorded temporarily on this device for assessment playback. Audio is not uploaded or saved.</p>
        </div>
      </div>
      {!hasPermission ? (
        <button className="button button--primary" onClick={onRequest} disabled={status === "requesting"}>
          <Mic aria-hidden="true" />
          {status === "requesting" ? "Waiting for permission..." : "Allow microphone"}
        </button>
      ) : (
        <>
          <label className="field">
            <span>Input device</span>
            <select value={selectedDeviceId} onChange={(event) => onDeviceChange(event.target.value)} disabled={status === "running"}>
              {devices.map((device, index) => (
                <option key={device.deviceId || index} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
          <InputMeter level={level} />
          <p className="hint">Hum one comfortable note for a moment. The Start button unlocks after a usable signal is detected.</p>
          <button className="button button--ghost" onClick={onRequest}>
            <RefreshCw aria-hidden="true" />
            Recheck microphone
          </button>
        </>
      )}
    </section>
  );
}
