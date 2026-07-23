import { useMemo, useRef } from "react";
import { Headphones, RotateCcw, SlidersHorizontal, Volume2 } from "lucide-react";
import type { ExerciseDefinition } from "../types/exercise";
import type { PitchFrame } from "../types/pitch";
import type { SessionResult } from "../types/scoring";
import { midiToNoteName } from "../pitch/conversion/midiToNote";
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
  const startingNote = midiToNoteName(exercise.rootMidi);
  const suggestion = result.overallScore >= 90
    ? {
      title: "Nicely centred",
      body: "Your pitch was accurate and steady. Keep using this starting note and build the same control through the exercise.",
      tone: "positive"
    }
    : result.overallScore >= 75
      ? {
        title: "Mostly in tune",
        body: "Your pitch is developing well. Repeat the warmup and give each note a little more time to settle.",
        tone: "positive"
      }
      : result.overallScore >= 55
        ? {
          title: "Good practice start",
          body: "You found part of the exercise. Try again with an even breath and a relaxed, steady sound.",
          tone: "steady"
        }
        : {
          title: "Try a comfortable starting note",
          body: `Start with ${startingNote}. It gives you a clear, centred reference before you move through the rest of the exercise.`,
          tone: "encouraging"
        };
  const duration = exercise.steps.at(-1)?.endTime ?? 0;
  // Build the completed timeline at its full duration so playback never reveals
  // the pitch trail progressively; only the playhead follows the audio.
  const timelineModel = useMemo(
    () => buildPitchTimelineModel(exercise, pitchFrames, duration, { fullTrail: true }),
    [exercise, pitchFrames, duration]
  );
  return (
    <main className="app-main app-main--results">
      <section className="results-performance" aria-label="Performance results">
        <div className="button-row results-actions">
          <button className="button button--primary" onClick={onRetry}><RotateCcw aria-hidden="true" />Repeat warmup</button>
          <button className="button button--ghost" onClick={onChange}><SlidersHorizontal aria-hidden="true" />Adjust settings</button>
          <button className="button button--ghost" onClick={onReplay}><Volume2 aria-hidden="true" />Replay scale</button>
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
        <p className="results-performance__description">Compare your smoothed voice with the expected notes, then match each section to its assessment below.</p>
      </section>
      <section className={`results-summary results-summary--${suggestion.tone}`} aria-label="Assessment summary">
        <div className="results-summary__coverage">
          <p className="eyebrow">Coverage</p>
          <strong>{result.completedNotes} of {result.totalNotes}</strong>
          <p>notes had enough voiced audio.</p>
        </div>
        <div className="results-summary__suggestion">
          <p className="eyebrow">Suggestion</p>
          <h2>{suggestion.title}</h2>
          <p>{suggestion.body}</p>
        </div>
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
    </main>
  );
}
