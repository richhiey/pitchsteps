# Implementation Notes

## Plan

1. Application shell, design tokens, responsive layout, and explicit session state machine.
2. Browser audio feature detection, microphone permission, device selection, AudioContext, AudioWorklet level metering, clipping detection, local session recording, worker hookup, and cleanup.
3. Web Worker pitch detector: mono PCM, resampling to 16 kHz, 1,024-sample frames, 160-sample hop, YIN, confidence, voicing, median and continuity smoothing.
4. Musical conversion, scale builder, Web Audio-clock exercise controller, count-in, and guide tones.
5. Live exercise UI with target, detected note, pitch lane, progress, and text/icon states.
6. Scoring windows, per-note results, session aggregate, retry, stop, errors, accessibility, reduced motion, tests.

## Proposed Module Structure

The project follows the product specification under `src/audio`, `src/audio-worklet`, `src/pitch`, `src/workers`, `src/exercise`, `src/scoring`, `src/visualization`, `src/components`, `src/store`, `src/types`, and `src/utils`.

## Browser APIs Requiring Feature Detection

- `navigator.mediaDevices`
- `navigator.mediaDevices.getUserMedia`
- `navigator.mediaDevices.enumerateDevices`
- `AudioContext` and `webkitAudioContext`
- `audioContext.audioWorklet`
- `Worker`
- `MediaRecorder`
- `SharedArrayBuffer`
- `navigator.mediaDevices.ondevicechange`
- `matchMedia("(prefers-reduced-motion: reduce)")`

## Deviations

- This MVP implements real-time YIN-based pitch estimation with pYIN-aligned confidence and temporal smoothing, not true pYIN Viterbi decoding.
- PCM used for pitch analysis is discarded after worker analysis. During the singing phase, `MediaRecorder` keeps a temporary encoded recording in memory for assessment playback; it is revoked on retry or page close and is never uploaded or persisted.
- Browser/device compatibility is feature-detected in-app; real microphone behavior still requires manual validation on target browsers and hardware.
