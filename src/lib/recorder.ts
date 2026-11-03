/** Muse Voice push-to-talk expects 16 kHz mono 16-bit PCM. */
export const VOICE_SAMPLE_RATE = 16_000;
export const MAX_RECORDING_SECONDS = 20;

export type VoiceRecording = {
  /** Stop recording and resolve with 16 kHz mono PCM16 audio. */
  stop(): Promise<ArrayBuffer>;
  /** Stop and discard the recording. */
  cancel(): void;
};

export function voiceInputSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof window !== "undefined" &&
    typeof window.MediaRecorder === "function" &&
    typeof window.OfflineAudioContext === "function"
  );
}

/** Convert mono float samples in [-1, 1] to little-endian PCM16. */
export function floatToPcm16(samples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return buffer;
}

async function toPcm16(blob: Blob): Promise<ArrayBuffer> {
  const encoded = await blob.arrayBuffer();
  const decoder = new AudioContext();
  try {
    const decoded = await decoder.decodeAudioData(encoded);
    const seconds = Math.min(decoded.duration, MAX_RECORDING_SECONDS);
    const frames = Math.max(1, Math.ceil(seconds * VOICE_SAMPLE_RATE));
    // Rendering through a 1-channel offline context downmixes and resamples.
    const offline = new OfflineAudioContext(1, frames, VOICE_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return floatToPcm16(rendered.getChannelData(0));
  } finally {
    void decoder.close();
  }
}

/**
 * Record one short spoken question from the microphone. Audio stays in the
 * browser until the user stops; it is then sent once for transcription.
 */
export async function startVoiceRecording(onAutoStop: () => void): Promise<VoiceRecording> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  const stopped = new Promise<void>((resolve) => {
    recorder.addEventListener("stop", () => resolve(), { once: true });
  });
  const release = () => stream.getTracks().forEach((track) => track.stop());
  const autoStop = window.setTimeout(onAutoStop, MAX_RECORDING_SECONDS * 1000);

  recorder.start();

  return {
    async stop() {
      window.clearTimeout(autoStop);
      if (recorder.state !== "inactive") recorder.stop();
      await stopped;
      release();
      return toPcm16(new Blob(chunks, { type: recorder.mimeType }));
    },
    cancel() {
      window.clearTimeout(autoStop);
      if (recorder.state !== "inactive") recorder.stop();
      release();
    },
  };
}
