const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/webm"
] as const;

export class SessionRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  get isRecording(): boolean {
    return this.recorder?.state === "recording";
  }

  start(stream: MediaStream): boolean {
    if (typeof MediaRecorder === "undefined" || this.recorder !== null) return false;
    const mimeType = typeof MediaRecorder.isTypeSupported === "function"
      ? MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate))
      : undefined;

    try {
      this.chunks = [];
      this.recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      this.recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) this.chunks.push(event.data);
      });
      this.recorder.start(250);
      return true;
    } catch {
      this.recorder = null;
      this.chunks = [];
      return false;
    }
  }

  stop(): Promise<Blob | null> {
    const recorder = this.recorder;
    if (!recorder || recorder.state === "inactive") return Promise.resolve(null);

    return new Promise((resolve) => {
      recorder.addEventListener("stop", () => {
        const blob = this.chunks.length > 0
          ? new Blob(this.chunks, { type: recorder.mimeType || this.chunks[0].type })
          : null;
        this.recorder = null;
        this.chunks = [];
        resolve(blob);
      }, { once: true });
      recorder.stop();
    });
  }
}
