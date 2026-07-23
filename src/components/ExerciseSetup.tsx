import { Play, Volume2 } from "lucide-react";
import { midiToNoteName, NOTE_OPTIONS } from "../pitch/conversion/midiToNote";

interface ExerciseSetupProps {
  rootMidi: number;
  bpm: number;
  guideVolume: number;
  canStart: boolean;
  onRootChange: (midi: number) => void;
  onBpmChange: (bpm: number) => void;
  onGuideVolumeChange: (volume: number) => void;
  onPreview: () => void;
  onStart: () => void;
}

export function ExerciseSetup({
  rootMidi,
  bpm,
  guideVolume,
  canStart,
  onRootChange,
  onBpmChange,
  onGuideVolumeChange,
  onPreview,
  onStart
}: ExerciseSetupProps) {
  return (
    <section className="panel" aria-labelledby="exercise-heading">
      <div className="panel__heading">
        <Play aria-hidden="true" />
        <div>
          <h2 id="exercise-heading">Exercise</h2>
          <p>Do-Re-Mi-Fa-Sol-La-Ti-Do, two beats per note.</p>
          <span className="octave-preview">Focused register · {midiToNoteName(rootMidi)}–{midiToNoteName(rootMidi + 12)}</span>
        </div>
      </div>
      <div className="setup-grid">
        <label className="field">
          <span>Starting note</span>
          <select value={rootMidi} onChange={(event) => onRootChange(Number(event.target.value))}>
            {NOTE_OPTIONS.map((note) => (
              <option key={note.midi} value={note.midi}>
                {note.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Tempo</span>
          <input type="number" min="60" max="120" step="5" value={bpm} onChange={(event) => onBpmChange(Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Guide volume</span>
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.05"
            value={guideVolume}
            onChange={(event) => onGuideVolumeChange(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="button-row">
        <button className="button button--ghost" onClick={onPreview}>
          <Volume2 aria-hidden="true" />
          Hear this note
        </button>
        <button className="button button--primary" onClick={onStart} disabled={!canStart}>
          <Play aria-hidden="true" />
          Start exercise
        </button>
      </div>
    </section>
  );
}
