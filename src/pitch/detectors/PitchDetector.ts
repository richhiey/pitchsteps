import type { DetectorConfiguration, PitchCandidate } from "../../types/pitch";

export interface DetectionResult {
  frequencyHz: number | null;
  confidence: number;
  candidates: PitchCandidate[];
}

export interface PitchDetector {
  detect(frame: Float32Array, config: DetectorConfiguration): DetectionResult;
}
