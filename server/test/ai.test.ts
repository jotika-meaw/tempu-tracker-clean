import assert from "node:assert/strict";
import test from "node:test";
import { AiError } from "../ai/errors.ts";
import { MetaAIService } from "../ai/service.ts";
import {
  buildInstructions,
  buildRouteContext,
  formatLiveSummary,
} from "../ai/prompt.ts";
import { TEMPU_ROUTE_NUMBERS } from "../../shared/index.ts";

const liveSummary = {
  liveDataAvailable: true,
  totalFresh: 0,
  staleHidden: 0,
  byRoute: [] as Array<{ routeNumber: string; count: number }>,
  serverTime: "2026-01-01T00:00:00.000Z",
};

function serviceWith(
  responder: (callNumber: number) => Promise<{ output_text?: string }>,
  overrides: Record<string, unknown> = {}
) {
  const calls: Array<Record<string, unknown>> = [];
  const sleeps: number[] = [];
  const client = {
    async create(params: Record<string, unknown>) {
      calls.push(params);
      return responder(calls.length);
    },
  };
  const service = new MetaAIService({
    client,
    model: "muse-spark-1.2-contributor",
    baseUrl: "https://api.meta.ai/v1",
    maxOutputTokens: 100,
    timeoutMs: 1000,
    allowedRouteNumbers: TEMPU_ROUTE_NUMBERS,
    maxRetries: 0,
    sleep: async (milliseconds) => {
      sleeps.push(milliseconds);
    },
    ...overrides,
  } as ConstructorParameters<typeof MetaAIService>[0]);
  return { service, calls, sleeps };
}

test("AI service reports missing configuration without crashing", async () => {
  const service = new MetaAIService({
    client: null,
    model: "muse-spark-1.2-contributor",
    baseUrl: "https://api.meta.ai/v1",
    maxOutputTokens: 100,
    timeoutMs: 1000,
    allowedRouteNumbers: TEMPU_ROUTE_NUMBERS,
    maxRetries: 0,
  });

  assert.equal(service.configured, false);
  await assert.rejects(
    service.ask({ message: "রুট ০১", language: "bn", liveSummary }),
    (error: unknown) =>
      error instanceof AiError &&
      error.code === "AI_NOT_CONFIGURED" &&
      error.status === 503
  );
});

test("AI prompt is grounded in the verified route dataset and excludes coordinates", async () => {
  const { service, calls } = serviceWith(async () => ({
    output_text: "রুট ০১-এ অক্সিজেন থেকে বারেক বিল্ডিং মোড় যাওয়া যায়।",
  }));

  const result = await service.ask({
    message: "কীভাবে বারেক বিল্ডিং যাব?",
    language: "bn",
    liveSummary,
  });

  assert.match(result.answer, /রুট ০১/);
  assert.equal(calls.length, 1);
  const params = calls[0];
  assert.equal(params.store, false);
  assert.equal(params.max_output_tokens, 100);
  assert.equal(params.model, "muse-spark-1.2-contributor");
  assert.match(String(params.instructions), /VERIFIED ROUTE DATASET/);
  assert.match(String(params.instructions), /Route 01/);
  assert.match(String(params.instructions), /Never invent/);
  assert.match(String(params.instructions), /Route 15/);
  assert.match(String(params.instructions), /আবদুস সাত্তার রোড/);
  assert.doesNotMatch(JSON.stringify(params), /22\.3569/);
  assert.doesNotMatch(JSON.stringify(params), /91\.7832/);
});

test("AI health does not include the API key", () => {
  const { service } = serviceWith(async () => ({ output_text: "রুট ০১" }));
  const health = service.health();
  assert.deepEqual(health, {
    configured: true,
    model: "muse-spark-1.2-contributor",
    baseUrl: "https://api.meta.ai/v1",
  });
  assert.doesNotMatch(JSON.stringify(health), /key|secret/i);
});

test("AI maps authentication failures to a safe 502 without retrying", async () => {
  const { service, calls } = serviceWith(async () => {
    throw Object.assign(new Error("provider secret detail"), { status: 401 });
  }, { maxRetries: 2 });

  await assert.rejects(
    service.ask({ message: "রুট ০১", language: "bn", liveSummary }),
    (error: unknown) =>
      error instanceof AiError &&
      error.code === "AI_AUTH_FAILED" &&
      error.status === 502 &&
      !error.message.includes("secret")
  );
  assert.equal(calls.length, 1);
});

test("AI retries rate limits and honours Retry-After", async () => {
  const { service, calls, sleeps } = serviceWith(
    async () => {
      throw Object.assign(new Error("rate limited"), {
        status: 429,
        headers: { "retry-after": "1" },
      });
    },
    { maxRetries: 2 }
  );

  await assert.rejects(
    service.ask({ message: "রুট ০১", language: "bn", liveSummary }),
    (error: unknown) =>
      error instanceof AiError &&
      error.code === "AI_RATE_LIMITED" &&
      error.status === 429 &&
      error.retryAfterSeconds === 1
  );
  assert.equal(calls.length, 3);
  assert.deepEqual(sleeps, [1000, 1000]);
});

test("AI maps provider outages and timeouts to bounded retries", async () => {
  const unavailable = serviceWith(
    async () => {
      throw Object.assign(new Error("upstream down"), { status: 503 });
    },
    { maxRetries: 2 }
  );
  await assert.rejects(
    unavailable.service.ask({ message: "রুট ০১", language: "bn", liveSummary }),
    (error: unknown) =>
      error instanceof AiError && error.code === "AI_UNAVAILABLE" && error.status === 503
  );
  assert.equal(unavailable.calls.length, 3);

  const timedOut = serviceWith(
    async () => {
      throw Object.assign(new Error("upstream timed out"), { status: 504 });
    },
    { maxRetries: 1 }
  );
  await assert.rejects(
    timedOut.service.ask({ message: "রুট ০১", language: "bn", liveSummary }),
    (error: unknown) =>
      error instanceof AiError && error.code === "AI_TIMEOUT" && error.status === 504
  );
  assert.equal(timedOut.calls.length, 2);
});

test("AI client timeout is enforced even if the provider never answers", async () => {
  const { service } = serviceWith(
    () => new Promise<{ output_text?: string }>(() => undefined),
    { timeoutMs: 10, maxRetries: 0 }
  );

  await assert.rejects(
    service.ask({ message: "রুট ০১", language: "bn", liveSummary }),
    (error: unknown) =>
      error instanceof AiError && error.code === "AI_TIMEOUT" && error.status === 504
  );
});

test("AI rejects empty output and unexpected route numbers", async () => {
  const empty = serviceWith(async () => ({ output_text: "   " }));
  await assert.rejects(
    empty.service.ask({ message: "রুট ০১", language: "bn", liveSummary }),
    (error: unknown) =>
      error instanceof AiError && error.code === "AI_INVALID_RESPONSE"
  );

  const invented = serviceWith(async () => ({
    output_text: "রুট ৯৯-এ যান, তারপর সোজা হাঁটুন।",
  }));
  await assert.rejects(
    invented.service.ask({ message: "কীভাবে যাব?", language: "bn", liveSummary }),
    (error: unknown) =>
      error instanceof AiError && error.code === "AI_INVALID_RESPONSE"
  );

  const explicitAbsence = serviceWith(async () => ({
    output_text: "রুট ০৯ যাচাইকৃত তালিকায় নেই, তাই এই রুট সম্পর্কে বলা যাচ্ছে না।",
  }));
  const answer = await explicitAbsence.service.ask({
    message: "রুট ০৯ আছে?",
    language: "bn",
    liveSummary,
  });
  assert.match(answer.answer, /নেই/);
});

test("AI accepts plain English statements that a route does not exist", async () => {
  for (const output_text of [
    "There is no route 09 in the verified dataset.",
    "No verified route 09 exists.",
    "Route 09 isn't in the verified list.",
    "Route 09 is not a verified route.",
    "Route 09 cannot be verified.",
  ]) {
    const { service } = serviceWith(async () => ({ output_text }));
    const result = await service.ask({ message: "Is there a route 09?", language: "en", liveSummary });
    assert.equal(result.answer, output_text);
  }
});

test("AI accepts the prompt's own wording for an unverifiable route", async () => {
  const output_text = "Route 09 cannot currently be verified.";
  const { service } = serviceWith(async () => ({ output_text }));
  const result = await service.ask({ message: "Is there a route 09?", language: "en", liveSummary });
  assert.equal(result.answer, output_text);
});

test("AI answers directly when asked about a route that does not exist", async () => {
  const cases = [
    { message: "Tell me about route 09", language: "en", expected: /^Route 09 is not in the verified dataset\. Verified routes: 01, .*17\.$/ },
    { message: "Does route 9 exist?", language: "en", expected: /^Route 09 is not in the verified dataset\./ },
    { message: "রুট ০৯ কোথায় যায়?", language: "bn", expected: /^রুট ০৯ যাচাইকৃত তালিকায় নেই। যাচাইকৃত রুট: ০১, .*১৭।$/ },
    { message: "Tell me about route 9", language: "ctg", expected: /^রুট ০৯ যাচাই করা তালিকাত নাই।/ },
  ] as const;

  for (const { message, language, expected } of cases) {
    const { service } = serviceWith(async () => ({
      output_text: "Route 09 runs from Lal Dighi to CDA.",
    }));
    const result = await service.ask({ message, language, liveSummary });
    assert.match(result.answer, expected);
    assert.doesNotMatch(result.answer, /Lal Dighi/);
  }
});

test("AI still rejects an invented route the user did not ask about", async () => {
  const { service } = serviceWith(async () => ({ output_text: "Take route 99 instead." }));
  await assert.rejects(
    service.ask({ message: "Is there a route 09?", language: "en", liveSummary }),
    (error: unknown) => error instanceof AiError && error.code === "AI_INVALID_RESPONSE"
  );
});

test("AI still rejects an invented route next to an unrelated negative", async () => {
  for (const output_text of [
    "Take route 09 to Lal Dighi, no change needed.",
    "Board route 99. Do not get off early.",
  ]) {
    const { service } = serviceWith(async () => ({ output_text }));
    await assert.rejects(
      service.ask({ message: "How do I get there?", language: "en", liveSummary }),
      (error: unknown) => error instanceof AiError && error.code === "AI_INVALID_RESPONSE"
    );
  }
});

test("AI gives the model its data in the selected answer language", async () => {
  const bangla = /[ঀ-৿]/;
  const english = serviceWith(async () => ({ output_text: "Take route 01." }));
  await english.service.ask({ message: "লালদীঘি কোথায়?", language: "en", liveSummary });
  const englishPrompt = String(english.calls[0].instructions);
  assert.doesNotMatch(englishPrompt.split("VERIFIED ROUTE DATASET")[1], bangla);
  assert.match(englishPrompt, /Route 01: Oxygen – Barek Building/);
  assert.match(englishPrompt, /Answer only in English, even if the question is in Bangla/);

  const standard = serviceWith(async () => ({ output_text: "রুট ০১-এ যান।" }));
  await standard.service.ask({ message: "Where is Lal Dighi?", language: "bn", liveSummary });
  const banglaPrompt = String(standard.calls[0].instructions);
  assert.match(banglaPrompt, /Route 01: অক্সিজেন – বারেক বিল্ডিং/);
  assert.match(banglaPrompt, /Answer only in standard Bangla, even if the question is in English/);
});

test("AI replaces Bangla place names left in an English answer", async () => {
  const { service } = serviceWith(async () => ({
    output_text: "Change at অক্সিজেন মোড় for লালদীঘি.",
  }));
  const result = await service.ask({ message: "লালদীঘি?", language: "en", liveSummary });
  assert.equal(result.answer, "Change at Oxygen Mor for Lal Dighi.");
});

test("AI leaves Bangla answers untouched", async () => {
  const { service } = serviceWith(async () => ({ output_text: "লালদীঘি থেকে রুট ০৩।" }));
  const result = await service.ask({ message: "লালদীঘি?", language: "bn", liveSummary });
  assert.equal(result.answer, "লালদীঘি থেকে রুট ০৩।");
});

test("live summary explicitly marks unavailable tracking data", () => {
  const text = formatLiveSummary({
    liveDataAvailable: false,
    totalFresh: 0,
    staleHidden: 0,
    byRoute: [],
    serverTime: "2026-01-01T00:00:00.000Z",
  });
  assert.match(text, /currently unavailable/);
  assert.match(text, /Do not claim zero vehicles/);
  assert.match(text, /cannot be verified/);
});

test("route context documents Route 15 as partially inferred", () => {
  const context = buildRouteContext();
  assert.match(context, /Route 15/);
  assert.match(context, /partially inferred/);
  assert.match(context, /return via \(not a stop\): আবদুস সাত্তার রোড/);
  assert.match(buildRouteContext("en"), /return via \(not a stop\): Abdus Sattar Road/);
});

test("instructions include language and anti-hallucination constraints", () => {
  const instructions = buildInstructions(
    buildRouteContext(),
    formatLiveSummary(liveSummary),
    "ctg"
  );
  assert.match(instructions, /Chittagonian-style/);
  assert.match(instructions, /standard Bangla/);
  assert.match(instructions, /Never invent/);
  assert.match(instructions, /untrusted input/);
});
