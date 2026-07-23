import { useMemo, useRef } from "react";
import { Headphones, RotateCcw, SlidersHorizontal, Volume2 } from "lucide-react";
import type { ExerciseDefinition } from "../types/exercise";
import type { PitchFrame } from "../types/pitch";
import type { SessionResult } from "../types/scoring";
import { buildPitchTimelineModel } from "../visualization/pitchTimelineModel";
import { PitchTimeline } from "./PitchTimeline";

interface ResultsScreenProps {
  result: SessionResult;
  exercise: ExerciseDefinition;
  pitchFrames: PitchFrame[];
  recordingUrl: string | null;
  recordingStatus: "idle" | "recording" | "processing" | "ready" | "unavailable";
  onRetry: () => void;
  onChange: () => void;
  onReplay: () => void;
}

export function ResultsScreen({
  result,
  exercise,
  pitchFrames,
  recordingUrl,
  recordingStatus,
  onRetry,
  onChange,
  onReplay
}: ResultsScreenProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const label = result.overallScore >= 90 ? "Nicely centred" : result.overallScore >= 75 ? "Mostly in tune" : result.overallScore >= 55 ? "Good practice start" : "Try a comfortable starting note";
  const duration = exercise.steps.at(-1)?.endTime ?? 0;
  const timelineModel = useMemo(
    () => buildPitchTimelineModel(exercise, pitchFrames, duration),
    [exercise, pitchFrames, duration]
  );
  return (
    <main className="app-main app-main--results">
      <section className="results-performance" aria-labelledby="performance-heading">
        <div className="results-performance__heading">
          <div>
            <p className="eyebrow">Performance timeline</p>
            <h2 id="performance-heading">Your pitch over time</h2>
          </div>
          <p>Compare your smoothed voice with the expected notes, then match each section to its assessment below.</p>
        </div>
        <PitchTimeline
          exercise={exercise}
          activeStep={null}
          model={timelineModel}
          completed
          playbackAudioRef={audioRef}
          playbackEnabled={Boolean(recordingUrl)}
        />
        <div className="assessment-playback">
          <div className="assessment-playback__label">
            <Headphones aria-hidden="true" />
            <div>
              <strong>Hear your performance</strong>
              <span>The playhead follows your recording while the complete pitch trail stays visible.</span>
            </div>
          </div>
          {recordingUrl ? (
            <audio ref={audioRef} controls preload="metadata" src={recordingUrl}>
              Your browser does not support audio playback.
            </audio>
          ) : (
            <span className="assessment-playback__status">
              {recordingStatus === "processing" ? "Preparing your recording…" : "Audio playback is unavailable for this attempt."}
            </span>
          )}
        </div>
      </section>
      <section className="results-summary">
        <div>
          <p className="eyebrow">Warmup complete</p>
          <h1>{label}</h1>
          <p>{result.completedNotes} of {result.totalNotes} notes had enough voiced audio.</p>
        </div>
        <strong aria-label={`Practice score ${result.overallScore}`}>{result.overallScore}</strong>
      </section>
      <div className="results-section-heading">
        <div>
          <p className="eyebrow">Note by note</p>
          <h2>Assessment details</h2>
        </div>
        <p>The cards follow the same left-to-right order as the timeline.</p>
      </div>
      <section className="results-grid" aria-label="Per-note scores">
        {result.noteScores.map((note) => (
          <article className="note-result" key={note.stepIndex}>
            <small className="note-result__step">Timeline segment {note.stepIndex + 1}</small>
            <span>{note.targetNote.solfege} · {note.targetNote.noteName}</span>
            <strong>{note.score ?? "Not enough audio"}</strong>
            <small>{note.medianCents === null ? "Listening was unclear" : `${Math.round(note.medianCents)} cents · ${note.predominantDirection}`}</small>
          </article>
        ))}
      </section>
      <p className="disclaimer">This is a practice estimate, not a professional vocal assessment.</p>
      <div className="button-row">
        <button className="button button--primary" onClick={onRetry}><RotateCcw aria-hidden="true" />Repeat warmup</button>
        <button className="button button--ghost" onClick={onChange}><SlidersHorizontal aria-hidden="true" />Adjust settings</button>
        <button className="button button--ghost" onClick={onReplay}><Volume2 aria-hidden="true" />Replay scale</button>
      </div>
    </main>
  );
}
