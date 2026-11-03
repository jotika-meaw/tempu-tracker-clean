import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { AiError } from "../ai/errors.ts";
import { MetaAIService, type MetaCreateParams, type MetaCreateResult } from "../ai/service.ts";
import { MuseTranscriber, TRANSCRIBE_MODEL, type SocketLike } from "../ai/transcribe.ts";
import { createApp } from "../app.ts";
import { TEMPU_ROUTE_NUMBERS } from "../../shared/index.ts";
import { createMemoryStore, createTestAi, createTestConfig } from "./helpers.ts";

const liveSummary = {
  liveDataAvailable: true,
  totalFresh: 0,
  staleHidden: 0,
  byRoute: [] as Array<{ routeNumber: string; count: number }>,
  serverTime: "2026-01-01T00:00:00.000Z",
};

function toolService(responder: (params: MetaCreateParams, call: number) => Promise<MetaCreateResult>) {
  const calls: MetaCreateParams[] = [];
  const service = new MetaAIService({
    client: {
      async create(params) {
        calls.push(structuredClone(params));
        return responder(params, calls.length);
      },
    },
    model: "muse-spark-1.2-contributor",
    baseUrl: "https://api.meta.ai/v1",
    maxOutputTokens: 100,
    timeoutMs: 1000,
    allowedRouteNumbers: TEMPU_ROUTE_NUMBERS,
    maxRetries: 0,
    sleep: async () => undefined,
  });
  return { service, calls };
}

test("AI service runs plan_trip tool calls and answers from their output", async () => {
  const call = {
    type: "function_call" as const,
    call_id: "call_1",
    name: "plan_trip",
    arguments: JSON.stringify({ from: "মুরাদপুর", to: "লালদীঘি" }),
  };
  const { service, calls } = toolService(async (_params, number) =>
    number === 1
      ? { output: [call], function_calls: [call] }
      : { output_text: "রুট ১৫ ধরে মুরাদপুর থেকে লালদীঘি যান।" }
  );

  const result = await service.ask({ message: "মুরাদপুর থেকে লালদীঘি?", language: "bn", liveSummary });

  assert.equal(result.answer, "রুট ১৫ ধরে মুরাদপুর থেকে লালদীঘি যান।");
  assert.deepEqual(result.toolCalls, ["plan_trip"]);
  assert.equal(calls.length, 2);
  assert.ok(calls[0].tools && calls[0].tools.length === 2);
  assert.match(calls[0].instructions, /plan_trip/);

  const second = calls[1].input as Array<Record<string, unknown>>;
  assert.deepEqual(second[0], { role: "user", content: "মুরাদপুর থেকে লালদীঘি?" });
  const output = second.find((item) => item.type === "function_call_output");
  assert.equal(output?.call_id, "call_1");
  assert.equal(JSON.parse(String(output?.output)).options[0].legs[0].route, "15");
});

test("AI service falls back to a tool-free answer when tools are rejected", async () => {
  const { service, calls } = toolService(async (params) => {
    if (params.tools) throw Object.assign(new Error("bad request"), { status: 400 });
    return { output_text: "রুট ১৫-এ লালদীঘি যাওয়া যায়।" };
  });

  const result = await service.ask({ message: "লালদীঘি?", language: "bn", liveSummary });

  assert.equal(result.answer, "রুট ১৫-এ লালদীঘি যাওয়া যায়।");
  assert.deepEqual(result.toolCalls, []);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].tools, undefined);
  assert.doesNotMatch(calls[1].instructions, /plan_trip/);
});

test("AI service stops offering tools after the round limit", async () => {
  const call = { type: "function_call" as const, call_id: "c", name: "find_stop", arguments: "{\"query\":\"লালদীঘি\"}" };
  const { service, calls } = toolService(async (params) =>
    params.tools ? { output: [call], function_calls: [call] } : { output_text: "রুট ০৩ লালদীঘি যায়।" }
  );

  const result = await service.ask({ message: "লালদীঘি", language: "bn", liveSummary });
  assert.equal(result.answer, "রুট ০৩ লালদীঘি যায়।");
  assert.equal(calls.length, 4);
  assert.equal(calls[3].tools, undefined);
});

class FakeSocket implements SocketLike {
  binaryType = "blob";
  readyState = 0;
  sent: Array<string | Uint8Array> = [];
  private listeners = new Map<string, Array<(event: never) => void>>();
  constructor(private readonly script: (socket: FakeSocket, message: string | Uint8Array) => void) {
    queueMicrotask(() => this.emit("open", {}));
  }
  addEventListener(type: string, listener: (event: never) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  emit(type: string, event: unknown) {
    for (const listener of this.listeners.get(type) ?? []) listener(event as never);
  }
  send(data: string | ArrayBufferLike | Uint8Array) {
    const message = typeof data === "string" ? data : new Uint8Array(data as ArrayBuffer);
    this.sent.push(message);
    this.script(this, message);
  }
  close() {
    this.readyState = 3;
  }
}

function scriptedTranscriber(script: (socket: FakeSocket, message: string | Uint8Array) => void) {
  const sockets: FakeSocket[] = [];
  const transcriber = new MuseTranscriber({
    apiKey: "test-key",
    timeoutMs: 1000,
    sleep: async () => undefined,
    createSocket: () => {
      const socket = new FakeSocket(script);
      sockets.push(socket);
      return socket;
    },
  });
  return { transcriber, sockets };
}

test("transcriber performs the Muse Voice handshake, streams 80 ms packets, and returns the final text", async () => {
  const { transcriber, sockets } = scriptedTranscriber((socket, message) => {
    if (typeof message !== "string") return;
    const frame = JSON.parse(message);
    if (frame.authorization) socket.emit("message", { data: JSON.stringify({ sessionId: "s1" }) });
    if (frame.type === "endStream") {
      socket.emit("message", { data: JSON.stringify({ type: "transcript", turnId: "t", transcript: "লালদীঘি" }) });
      socket.emit("message", {
        data: JSON.stringify({ type: "transcript", turnId: "t", transcript: "লালদীঘি কীভাবে যাব", final: true }),
      });
    }
  });

  const oneSecond = new Uint8Array(32_000);
  const transcript = await transcriber.transcribe(oneSecond, "bn");

  assert.equal(transcript, "লালদীঘি কীভাবে যাব");
  const [socket] = sockets;
  const handshake = JSON.parse(socket.sent[0] as string);
  assert.equal(handshake.model, TRANSCRIBE_MODEL);
  assert.equal(handshake.mode, "PUSH_TO_TALK");
  assert.equal(handshake.audioEncoding, "PCM_16KHZ");
  assert.deepEqual(handshake.languageBias, ["Bengali"]);
  assert.equal(handshake.authorization.accessToken, "Bearer test-key");

  const packets = socket.sent.filter((item) => typeof item !== "string") as Uint8Array[];
  assert.equal(packets.length, 13);
  assert.ok(packets.slice(0, -1).every((packet) => packet.byteLength === 2560));
  assert.deepEqual(JSON.parse(socket.sent.at(-1) as string), { type: "endStream" });
});

test("transcriber maps provider errors and empty speech to safe codes", async () => {
  const failing = scriptedTranscriber((socket, message) => {
    if (typeof message === "string" && JSON.parse(message).authorization) {
      socket.emit("close", { code: 1006 });
    }
  });
  await assert.rejects(
    failing.transcriber.transcribe(new Uint8Array(3200), "en"),
    (error: unknown) => error instanceof AiError && error.code === "AI_REQUEST_REJECTED"
  );

  const silent = scriptedTranscriber((socket, message) => {
    if (typeof message !== "string") return;
    const frame = JSON.parse(message);
    if (frame.authorization) socket.emit("message", { data: JSON.stringify({ sessionId: "s" }) });
    if (frame.type === "endStream") {
      socket.emit("message", { data: JSON.stringify({ type: "speechComplete", turnId: "t", transcript: "" }) });
    }
  });
  await assert.rejects(
    silent.transcriber.transcribe(new Uint8Array(3200), "bn"),
    (error: unknown) => error instanceof AiError && error.code === "TRANSCRIPT_EMPTY"
  );
});

test("transcribe endpoint validates audio and reports missing configuration", async () => {
  const config = createTestConfig();
  const store = createMemoryStore();
  const ai = createTestAi(null);

  const unconfigured = createApp({ config, store, ai, rateLimitEnabled: false });
  const off = await request(unconfigured)
    .post("/api/transcribe")
    .set("Content-Type", "application/octet-stream")
    .send(Buffer.alloc(16_000));
  assert.equal(off.status, 503);
  assert.equal(off.body.error.code, "AI_NOT_CONFIGURED");

  const received: Array<{ bytes: number; language: string }> = [];
  const transcriber = {
    configured: true,
    async transcribe(pcm: Uint8Array, language: string) {
      received.push({ bytes: pcm.byteLength, language });
      return "রুট ১১";
    },
  } as unknown as MuseTranscriber;
  const app = createApp({ config, store, ai, transcriber, rateLimitEnabled: false });

  const tooShort = await request(app)
    .post("/api/transcribe")
    .set("Content-Type", "application/octet-stream")
    .send(Buffer.alloc(100));
  assert.equal(tooShort.status, 400);
  assert.equal(tooShort.body.error.code, "INVALID_AUDIO");

  const tooLarge = await request(app)
    .post("/api/transcribe")
    .set("Content-Type", "application/octet-stream")
    .send(Buffer.alloc(32_000 * 21));
  assert.equal(tooLarge.status, 413);

  const ok = await request(app)
    .post("/api/transcribe?language=ctg")
    .set("Content-Type", "application/octet-stream")
    .send(Buffer.alloc(16_000));
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body, { transcript: "রুট ১১" });
  assert.deepEqual(received, [{ bytes: 16_000, language: "ctg" }]);
});
