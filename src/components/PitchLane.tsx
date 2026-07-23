import { buildPitchLaneModel, type PitchFeedbackState } from "../visualization/pitchLaneModel";

interface PitchLaneProps {
  cents: number | null;
  state: PitchFeedbackState;
}

export function PitchLane({ cents, state }: PitchLaneProps) {
  const model = buildPitchLaneModel(cents, state);
  return (
    <svg className={`pitch-lane pitch-lane--${state}`} viewBox="0 0 100 28" role="img" aria-label={`Pitch lane: ${model.label}`}>
      <line x1="6" y1="14" x2="94" y2="14" className="pitch-lane__rail" />
      <rect x="40" y="8" width="20" height="12" rx="2" className="pitch-lane__target" />
      <line x1="50" y1="5" x2="50" y2="23" className="pitch-lane__center" />
      {[-100, -50, 0, 50, 100].map((tick) => (
        <g key={tick}>
          <line x1={50 + tick / 2} y1="11" x2={50 + tick / 2} y2="17" className="pitch-lane__tick" />
        </g>
      ))}
      <circle cx={model.markerX} cy="14" r="4.6" opacity={model.markerOpacity} className="pitch-lane__marker" />
      <text x="8" y="26" className="pitch-lane__text">Lower</text>
      <text x="50" y="26" className="pitch-lane__text pitch-lane__text--center">Target</text>
      <text x="92" y="26" className="pitch-lane__text pitch-lane__text--end">Higher</text>
    </svg>
  );
}
