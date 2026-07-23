import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionRecorder } from "../../src/audio/SessionRecorder";

class FakeMediaRecorder extends EventTarget {
  static isTypeSupported(type: string) {
    return type === "audio/webm;codecs=opus";
  }

  state: RecordingState = "inactive";
  mimeType: string;

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    super();
    this.mimeType = options?.mimeType ?? "";
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    const dataEvent = Object.assign(new Event("dataavailable"), {
      data: new Blob(["voice"], { type: this.mimeType })
    });
    this.dispatchEvent(dataEvent);
    this.dispatchEvent(new Event("stop"));
  }
}

describe("SessionRecorder", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records local microphone audio into a playable blob", async () => {
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    const recorder = new SessionRecorder();

    expect(recorder.start({} as MediaStream)).toBe(true);
    expect(recorder.isRecording).toBe(true);

    const blob = await recorder.stop();
    expect(blob?.size).toBeGreaterThan(0);
    expect(blob?.type).toBe("audio/webm;codecs=opus");
    expect(recorder.isRecording).toBe(false);
  });

  it("reports unavailable when MediaRecorder is unsupported", () => {
    vi.stubGlobal("MediaRecorder", undefined);
    expect(new SessionRecorder().start({} as MediaStream)).toBe(false);
  });
});
