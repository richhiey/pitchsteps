export const buildAudioConstraints = (deviceId?: string): MediaStreamConstraints => ({
  audio: {
    deviceId: deviceId ? { exact: deviceId } : undefined,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});
