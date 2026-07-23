import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PracticeControls } from "../../src/components/PracticeControls";
import type { MicrophoneStatus } from "../../src/types/session";

const callbacks = {
  onRequestMicrophone: vi.fn(),
  onDeviceChange: vi.fn(),
  onRootChange: vi.fn(),
  onBpmChange: vi.fn(),
  onGuideVolumeChange: vi.fn(),
  onPreview: vi.fn(),
  onStart: vi.fn()
};

const renderControls = ({
  microphoneStatus = "unknown",
  devices = [],
  selectedDeviceId = "",
  canStart = false,
  locked = false
}: {
  microphoneStatus?: MicrophoneStatus;
  devices?: MediaDeviceInfo[];
  selectedDeviceId?: string;
  canStart?: boolean;
  locked?: boolean;
} = {}) => render(
  <PracticeControls
    microphoneStatus={microphoneStatus}
    devices={devices}
    selectedDeviceId={selectedDeviceId}
    level={null}
    rootMidi={60}
    bpm={90}
    guideVolume={0.35}
    canStart={canStart}
    locked={locked}
    {...callbacks}
  />
);

describe("PracticeControls", () => {
  it("renders labelled note, tempo, and microphone dropdowns with expected defaults", () => {
    renderControls();

    const note = screen.getByLabelText("Starting note") as HTMLSelectElement;
    const tempo = screen.getByLabelText("Tempo") as HTMLSelectElement;
    const microphone = screen.getByLabelText("Microphone") as HTMLSelectElement;

    expect(note.value).toBe("60");
    expect(note.options).toHaveLength(25);
    expect(tempo.value).toBe("90");
    expect(tempo.options).toHaveLength(13);
    expect(microphone.disabled).toBe(true);
    expect(microphone.options[0].textContent).toBe("Allow microphone first");
  });

  it("populates the microphone dropdown and passes selector changes through", () => {
    const device = {
      deviceId: "studio-mic",
      groupId: "group",
      kind: "audioinput",
      label: "Studio microphone",
      toJSON: () => ({})
    } as MediaDeviceInfo;
    renderControls({
      microphoneStatus: "ready",
      devices: [device],
      selectedDeviceId: device.deviceId,
      canStart: true
    });

    const microphone = screen.getByLabelText("Microphone") as HTMLSelectElement;
    expect(microphone.disabled).toBe(false);
    expect(microphone.value).toBe("studio-mic");
    expect((screen.getByRole("button", { name: "Start warmup" }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.change(screen.getByLabelText("Starting note"), { target: { value: "62" } });
    fireEvent.change(screen.getByLabelText("Tempo"), { target: { value: "105" } });

    expect(callbacks.onRootChange).toHaveBeenCalledWith(62);
    expect(callbacks.onBpmChange).toHaveBeenCalledWith(105);
  });

  it("locks every setting while a warmup is active", () => {
    renderControls({ locked: true });

    expect((screen.getByLabelText("Starting note") as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText("Tempo") as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText("Microphone") as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText("Guide volume") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Start warmup" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Warmup in progress. Stop the session to change these settings.")).toBeTruthy();
  });
});
