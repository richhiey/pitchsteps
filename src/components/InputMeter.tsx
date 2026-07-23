import { useEffect, useRef, useState } from "react";
import { meterPercent } from "../audio/levelAnalysis";
import type { LevelFrame } from "../types/audio";

type MeterState = "waiting" | "no-input" | "too-quiet" | "usable" | "clipping";

const nextMeterState = (previous: MeterState, level: LevelFrame | null): MeterState => {
  if (!level) return "waiting";
  if (level.clipped) return "clipping";
  const dbfs = level.rmsDbfs;

  // Use separate enter/exit thresholds so normal voice movement does not make
  // the label bounce between adjacent states.
  if (previous === "clipping" && level.peak >= 0.78) return "clipping";
  if (previous === "no-input" && dbfs < -57) return "no-input";
  if (previous === "too-quiet" && dbfs > -39) return "usable";
  if (previous === "usable" && dbfs > -45) return "usable";
  if (dbfs < -63) return "no-input";
  if (dbfs < -42) return "too-quiet";
  return "usable";
};

export function InputMeter({ level }: { level: LevelFrame | null }) {
  const [smoothedDbfs, setSmoothedDbfs] = useState(level?.rmsDbfs ?? -100);
  const [meterState, setMeterState] = useState<MeterState>(level ? "no-input" : "waiting");
  const stateRef = useRef(meterState);

  useEffect(() => {
    const target = level?.rmsDbfs ?? -100;
    setSmoothedDbfs((current) => current + (target - current) * 0.18);
    const next = nextMeterState(stateRef.current, level);
    if (next !== stateRef.current) {
      stateRef.current = next;
      setMeterState(next);
    }
  }, [level?.clipped, level?.peak, level?.rmsDbfs]);

  const percent = meterPercent(smoothedDbfs) * 100;
  const label = {
    waiting: "Waiting for signal",
    "no-input": "No input",
    "too-quiet": "A little quiet",
    usable: "In the zone",
    clipping: "Too loud"
  }[meterState];
  return (
    <div className={`meter meter--${meterState}`} aria-label={`Microphone level: ${label}`}>
      <div className="meter__track">
        <span className="meter__safe" />
        <span className="meter__fill" style={{ width: `${percent}%` }} />
        <span className="meter__signal-dot" style={{ left: `${percent}%` }} aria-hidden="true" />
      </div>
      <div className="meter__labels">
        <span>{label}</span>
        <span>{level ? `${Math.round(smoothedDbfs)} dBFS` : "-- dBFS"}</span>
      </div>
    </div>
  );
}
