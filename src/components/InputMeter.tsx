import { meterPercent } from "../audio/levelAnalysis";
import type { LevelFrame } from "../types/audio";

export function InputMeter({ level }: { level: LevelFrame | null }) {
  const percent = level ? meterPercent(level.rmsDbfs) * 100 : 0;
  const label = !level ? "No signal yet" : level.clipped ? "Clipping" : level.rmsDbfs < -60 ? "No input" : level.rmsDbfs < -42 ? "Too quiet" : "Usable";
  return (
    <div className="meter" aria-label={`Microphone level: ${label}`}>
      <div className="meter__track">
        <span className="meter__safe" />
        <span className="meter__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="meter__labels">
        <span>{label}</span>
        <span>{level ? `${Math.round(level.rmsDbfs)} dBFS` : "-- dBFS"}</span>
      </div>
    </div>
  );
}
