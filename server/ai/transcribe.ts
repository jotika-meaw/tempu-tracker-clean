import { AiError } from "./errors";
import type { AiLanguage } from "../validation";

export const TRANSCRIBE_MODEL = "muse-voice-transcribe-1.0";
export const TRANSCRIBE_URL = "wss://api.meta.ai/v1/asr/realtime";
export const SAMPLE_RATE = 16_000;
const BYTES_PER_SECOND = SAMPLE_RATE * 2;
/** Muse Voice expects audio in 80 ms packets, paced in real time. */
const PACKET_BYTES = (BYTES_PER_SECOND * 80) / 1000;
export const MAX_AUDIO_SECONDS = 20;
export const MAX_AUDIO_BYTES = BYTES_PER_SECOND * MAX_AUDIO_SECONDS;
/** Packets sent ahead of real time to absorb network jitter. */
const LEAD_PACKETS = 5;

const LANGUAGE_BIAS: Record<AiLanguage, string> = {
  bn: "Bengali",
  ctg: "Bengali",
  en: "English",
};

/** The subset of the WHATWG WebSocket used here, so tests can inject a fake. */
export type SocketLike = {
  binaryType: string;
  readyState: number;
  send(data: string | ArrayBufferLike | Uint8Array): void;
  close(code?: number): void;
  addEventListener(type: "open" | "message" | "error" | "close", listener: (event: never) => void): void;
};

export type TranscriberOptions = {
  apiKey: string | null;
  timeoutMs: number;
  createSocket?: (url: string) => SocketLike;
  sleep?: (milliseconds: number) => Promise<void>;
};

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Push-to-talk transcription through Meta's Muse Voice realtime endpoint.
 * The browser records one short question as 16 kHz mono PCM16; the server
 * streams it to Meta and returns the final transcript. Audio is never stored.
 */
export class MuseTranscriber {
  private readonly apiKey: string | null;
  private readonly timeoutMs: number;
  private readonly createSocket: (url: string) => SocketLike;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(options: TranscriberOptions) {
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs;
    this.createSocket =
      options.createSocket ?? ((url) => new WebSocket(url) as unknown as SocketLike);
    this.sleep = options.sleep ?? defaultSleep;
  }

  get configured(): boolean {
    return this.apiKey !== null;
  }

  async transcribe(pcm: Uint8Array, language: AiLanguage): Promise<string> {
    if (!this.apiKey) {
      throw new AiError(503, "AI_NOT_CONFIGURED", "Voice input is not configured on this server.");
    }

    const audioSeconds = pcm.byteLength / BYTES_PER_SECOND;
    const deadline = this.timeoutMs + audioSeconds * 1000;
    const socket = this.createSocket(TRANSCRIBE_URL);
    socket.binaryType = "arraybuffer";

    return new Promise<string>((resolve, reject) => {
      const finals: string[] = [];
      let partial = "";
      let settled = false;
      let streaming = false;

      const finish = (error: AiError | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          socket.close(1000);
        } catch {
          // Already closed.
        }
        const transcript = (finals.length > 0 ? finals.join(" ") : partial).trim();
        if (error) reject(error);
        else if (!transcript) {
          reject(new AiError(422, "TRANSCRIPT_EMPTY", "No speech was recognised in the recording."));
        } else resolve(transcript);
      };

      const timer = setTimeout(() => {
        finish(new AiError(504, "AI_TIMEOUT", "Voice transcription did not finish in time.", { retryable: true }));
      }, deadline);

      const stream = async () => {
        streaming = true;
        const startedAt = Date.now();
        let sentSeconds = 0;
        for (let offset = 0; offset < pcm.byteLength && !settled; offset += PACKET_BYTES) {
          const packet = pcm.subarray(offset, Math.min(offset + PACKET_BYTES, pcm.byteLength));
          socket.send(packet);
          sentSeconds += packet.byteLength / BYTES_PER_SECOND;
          const aheadMs = sentSeconds * 1000 - (Date.now() - startedAt) - LEAD_PACKETS * 80;
          if (aheadMs > 0) await this.sleep(aheadMs);
        }
        if (!settled) socket.send(JSON.stringify({ type: "endStream" }));
      };

      socket.addEventListener("open", () => {
        socket.send(
          JSON.stringify({
            authorization: { accessToken: `Bearer ${this.apiKey}` },
            audioEncoding: "PCM_16KHZ",
            model: TRANSCRIBE_MODEL,
            mode: "PUSH_TO_TALK",
            partialMode: "CUMULATIVE",
            emitAudioProgress: false,
            languageBias: [LANGUAGE_BIAS[language]],
          })
        );
      });

      socket.addEventListener("message", (event: { data: unknown }) => {
        if (typeof event.data !== "string") return;
        let frame: Record<string, unknown>;
        try {
          frame = JSON.parse(event.data) as Record<string, unknown>;
        } catch {
          return;
        }

        if (typeof frame.sessionId === "string" && !streaming) {
          stream().catch(() =>
            finish(new AiError(503, "AI_UNAVAILABLE", "Voice audio could not be sent."))
          );
          return;
        }

        if (frame.type === "error") {
          finish(new AiError(503, "AI_UNAVAILABLE", "The voice provider reported an error."));
          return;
        }

        const transcript = typeof frame.transcript === "string" ? frame.transcript : null;
        if (transcript === null) return;

        if (frame.type === "speechComplete" || (frame.type === "transcript" && frame.final === true)) {
          finals.push(transcript);
          // Push-to-talk produces one turn per session.
          finish(null);
        } else if (frame.type === "transcript") {
          partial = transcript;
        }
      });

      socket.addEventListener("error", () => {
        finish(new AiError(503, "AI_UNAVAILABLE", "The voice provider could not be reached.", { retryable: true }));
      });

      socket.addEventListener("close", (event: { code?: number }) => {
        if (settled) return;
        if (event.code === 1000 && (finals.length > 0 || partial)) finish(null);
        else if (event.code === 1006 || event.code === 1008) {
          finish(new AiError(502, "AI_REQUEST_REJECTED", "The voice provider rejected the session."));
        } else finish(new AiError(503, "AI_UNAVAILABLE", "The voice provider closed the connection."));
      });
    });
  }
}
