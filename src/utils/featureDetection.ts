import type { AudioFeatures } from "../types/audio";

export const getAudioContextCtor = (): typeof AudioContext | null => {
  const win = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? win.webkitAudioContext ?? null;
};

export const detectAudioFeatures = (): AudioFeatures => {
  const mediaDevices = Boolean(navigator.mediaDevices);
  const audioContextCtor = typeof window !== "undefined" ? getAudioContextCtor() : null;
  return {
    mediaDevices,
    getUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
    enumerateDevices: Boolean(navigator.mediaDevices?.enumerateDevices),
    audioContext: Boolean(audioContextCtor),
    audioWorklet: Boolean(audioContextCtor && "audioWorklet" in AudioContext.prototype),
    worker: typeof Worker !== "undefined",
    sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
    deviceChange: Boolean(navigator.mediaDevices && "ondevicechange" in navigator.mediaDevices),
    reducedMotion: typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
    secureContext: window.isSecureContext
  };
};
