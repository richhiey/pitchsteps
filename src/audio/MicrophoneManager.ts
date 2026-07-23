import { buildAudioConstraints } from "./audioConstraints";
import { listInputDevices } from "./DeviceManager";

export class MicrophoneManager {
  stream: MediaStream | null = null;
  devices: MediaDeviceInfo[] = [];

  async request(deviceId?: string): Promise<MediaStream> {
    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia(buildAudioConstraints(deviceId));
    this.devices = await listInputDevices();
    return this.stream;
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
