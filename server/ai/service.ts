import { AiError } from "./errors";
import {
  buildInstructions,
  buildRouteContext,
  formatLiveSummary,
  type LiveSummary,
} from "./prompt";
import type { AiLanguage } from "../validation";
import { ROUTE_TOOLS, runRouteTool } from "./tools";
import { replacePlaceNamesWithEnglish } from "../../shared/placeNames";

export type MetaFunctionCall = {
  type: "function_call";
  call_id: string;
  name: string;
  arguments: string;
};

export type MetaCreateParams = {
  model: string;
  instructions: string;
  /** A plain question, or the running item list during a tool-call loop. */
  input: string | unknown[];
  store: false;
  max_output_tokens: number;
  tools?: readonly unknown[];
};

export type MetaCreateResult = {
  output_text?: string;
  /** Raw output items, echoed back to the model on the next tool round. */
  output?: unknown[];
  function_calls?: MetaFunctionCall[];
};

export type MetaClient = {
  create(params: MetaCreateParams): Promise<MetaCreateResult>;
};

export type MetaAIServiceOptions = {
  client: MetaClient | null;
  model: string;
  baseUrl: string;
  maxOutputTokens: number;
  timeoutMs: number;
  allowedRouteNumbers: readonly string[];
  maxRetries?: number;
  /** Offer the route tools to the model. Defaults to true. */
  toolsEnabled?: boolean;
  sleep?: (milliseconds: number) => Promise<void>;
};

export type AskInput = {
  message: string;
  language: AiLanguage;
  liveSummary: LiveSummary;
};

export type AskResult = {
  answer: string;
  model: string;
  /** Names of the route tools the model called, in order. */
  toolCalls: string[];
};

/** Tool rounds before the model must answer in text. */
const MAX_TOOL_ROUNDS = 3;
const MAX_CALLS_PER_ROUND = 4;

const ROUTE_CONTEXT: Record<AiLanguage, string> = {
  bn: buildRouteContext("bn"),
  en: buildRouteContext("en"),
  ctg: buildRouteContext("ctg"),
};

const ROUTE_ABSENCE_BEFORE = /\b(?:no|not|isn't|without)\s+(?:[\w-]+\s+){0,2}$/i;
const ROUTE_ABSENCE_NEAR =
  /(নেই|নাই|absent|not available|not in|not (?:a|an|listed|found|included|part|present|verified)|isn't|does not exist|doesn't exist|(?:cannot|can't)(?:\s+currently)?\s+be\s+verified|যাচাইকৃত\s*তালিকায়\s*নেই)/i;
const ROUTE_MENTION = /(?:রুট|route)\s*#?\s*([0-9]{1,2})/gi;

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    timer.unref?.();
  });
}

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

function normalizeDigits(value: string): string {
  return [...value]
    .map((character) => {
      const index = BENGALI_DIGITS.indexOf(character);
      return index >= 0 ? String(index) : character;
    })
    .join("");
}

function toBengaliDigits(value: string): string {
  return value.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[Number(digit)]);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new AiError(504, "AI_TIMEOUT", "The AI provider did not respond in time.", {
          retryable: true,
        })
      );
    }, timeoutMs);
    timer.unref?.();

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function retryAfterFromError(error: unknown): number | undefined {
  const candidate = error as {
    retryAfter?: unknown;
    headers?: Record<string, unknown>;
  };
  const raw =
    candidate.retryAfter ??
    candidate.headers?.["retry-after"] ??
    candidate.headers?.["Retry-After"];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(10, Math.ceil(parsed)) : undefined;
}

function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;

  const candidate = error as {
    status?: unknown;
    code?: unknown;
    name?: unknown;
    message?: unknown;
  };
  const status = typeof candidate.status === "number" ? candidate.status : undefined;
  const name = typeof candidate.name === "string" ? candidate.name : "";
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const retryAfterSeconds = retryAfterFromError(error);

  if (
    name.includes("Timeout") ||
    code === "ETIMEDOUT" ||
    code === "UND_ERR_CONNECT_TIMEOUT"
  ) {
    return new AiError(504, "AI_TIMEOUT", "The AI provider did not respond in time.", {
      retryable: true,
      retryAfterSeconds,
    });
  }

  if (status === 401 || status === 403) {
    return new AiError(
      502,
      "AI_AUTH_FAILED",
      "The AI provider rejected the server credential."
    );
  }

  if (status === 429) {
    return new AiError(429, "AI_RATE_LIMITED", "The AI provider rate limit was reached.", {
      retryable: true,
      retryAfterSeconds,
    });
  }

  if (status === 504) {
    return new AiError(504, "AI_TIMEOUT", "The AI provider timed out.", {
      retryable: true,
      retryAfterSeconds,
    });
  }

  if (status !== undefined && status >= 500) {
    return new AiError(503, "AI_UNAVAILABLE", "The AI provider is temporarily unavailable.", {
      retryable: true,
      retryAfterSeconds,
    });
  }

  if (status === 400 || status === 404 || status === 422) {
    return new AiError(
      502,
      "AI_REQUEST_REJECTED",
      "The AI provider rejected the request configuration."
    );
  }

  if (
    name.includes("Connection") ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED"
  ) {
    return new AiError(503, "AI_UNAVAILABLE", "The AI provider could not be reached.", {
      retryable: true,
      retryAfterSeconds,
    });
  }

  return new AiError(503, "AI_UNAVAILABLE", "The AI provider could not be reached.", {
    retryable: true,
    retryAfterSeconds,
  });
}

function unknownRouteMention(
  answer: string,
  allowedRouteNumbers: ReadonlySet<string>
): string | null {
  const normalized = normalizeDigits(answer);

  for (const match of normalized.matchAll(ROUTE_MENTION)) {
    const routeNumber = match[1].padStart(2, "0");
    if (allowedRouteNumbers.has(routeNumber)) continue;

    const index = match.index ?? 0;
    const context = normalized.slice(Math.max(0, index - 45), index + 80);
    const explicitlyUnavailable =
      ROUTE_ABSENCE_BEFORE.test(normalized.slice(Math.max(0, index - 45), index)) ||
      ROUTE_ABSENCE_NEAR.test(context);

    if (!explicitlyUnavailable) return routeNumber;
  }

  return null;
}

function asksAboutRoute(message: string, routeNumber: string): boolean {
  return [...normalizeDigits(message).matchAll(ROUTE_MENTION)].some(
    (match) => match[1].padStart(2, "0") === routeNumber
  );
}

function routeNotVerifiedAnswer(
  routeNumber: string,
  allowedRouteNumbers: ReadonlySet<string>,
  language: AiLanguage
): string {
  const verified = [...allowedRouteNumbers].join(", ");
  if (language === "en") {
    return `Route ${routeNumber} is not in the verified dataset. Verified routes: ${verified}.`;
  }
  const list = toBengaliDigits(verified);
  const number = toBengaliDigits(routeNumber);
  return language === "ctg"
    ? `রুট ${number} যাচাই করা তালিকাত নাই। যাচাই করা রুট: ${list}।`
    : `রুট ${number} যাচাইকৃত তালিকায় নেই। যাচাইকৃত রুট: ${list}।`;
}

export class MetaAIService {
  private readonly client: MetaClient | null;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxOutputTokens: number;
  private readonly timeoutMs: number;
  private readonly allowedRouteNumbers: ReadonlySet<string>;
  private readonly maxRetries: number;
  private readonly toolsEnabled: boolean;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(options: MetaAIServiceOptions) {
    this.client = options.client;
    this.model = options.model;
    this.baseUrl = options.baseUrl;
    this.maxOutputTokens = options.maxOutputTokens;
    this.timeoutMs = options.timeoutMs;
    this.allowedRouteNumbers = new Set(options.allowedRouteNumbers);
    this.maxRetries = Math.max(0, Math.min(2, options.maxRetries ?? 2));
    this.toolsEnabled = options.toolsEnabled ?? true;
    this.sleep = options.sleep ?? defaultSleep;
  }

  get configured(): boolean {
    return this.client !== null;
  }

  health(): { configured: boolean; model: string; baseUrl: string } {
    return {
      configured: this.configured,
      model: this.model,
      baseUrl: this.baseUrl,
    };
  }

  async ask(input: AskInput): Promise<AskResult> {
    if (!this.client) {
      throw new AiError(
        503,
        "AI_NOT_CONFIGURED",
        "The Meta AI service is not configured on this server."
      );
    }

    const liveSummary = formatLiveSummary(input.liveSummary);
    let useTools = this.toolsEnabled;
    let items: unknown[] | null = null;
    const toolCalls: string[] = [];

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
      const offerTools = useTools && round < MAX_TOOL_ROUNDS;
      let response: MetaCreateResult;

      try {
        response = await this.createWithRetry({
          model: this.model,
          instructions: buildInstructions(ROUTE_CONTEXT[input.language], liveSummary, input.language, useTools),
          input: items ?? input.message,
          store: false,
          max_output_tokens: this.maxOutputTokens,
          ...(offerTools ? { tools: ROUTE_TOOLS } : {}),
        });
      } catch (error) {
        // If the provider rejects function tools for this model, answer from
        // the route dataset in the prompt instead of failing the question.
        if (round === 0 && useTools && error instanceof AiError && error.code === "AI_REQUEST_REJECTED") {
          useTools = false;
          response = await this.createWithRetry({
            model: this.model,
            instructions: buildInstructions(ROUTE_CONTEXT[input.language], liveSummary, input.language, false),
            input: input.message,
            store: false,
            max_output_tokens: this.maxOutputTokens,
          });
        } else {
          throw error;
        }
      }

      const calls = offerTools ? (response.function_calls ?? []).slice(0, MAX_CALLS_PER_ROUND) : [];
      if (calls.length === 0) {
        return {
          answer: this.validateAnswer(response.output_text, input),
          model: this.model,
          toolCalls,
        };
      }

      items = [
        ...(items ?? [{ role: "user", content: input.message }]),
        ...(response.output && response.output.length > 0 ? response.output : calls),
        ...calls.map((call) => ({
          type: "function_call_output",
          call_id: call.call_id,
          output: runRouteTool(call.name, call.arguments, input.language),
        })),
      ];
      toolCalls.push(...calls.map((call) => call.name));
    }

    throw new AiError(502, "AI_INVALID_RESPONSE", "The AI provider returned an unusable answer.");
  }

  private async createWithRetry(params: MetaCreateParams): Promise<MetaCreateResult> {
    const client = this.client as MetaClient;
    let lastError: AiError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        return await withTimeout(client.create(params), this.timeoutMs);
      } catch (error) {
        const aiError = toAiError(error);
        lastError = aiError;

        if (!aiError.retryable || attempt === this.maxRetries) {
          throw aiError;
        }

        const waitMs =
          aiError.retryAfterSeconds !== undefined
            ? aiError.retryAfterSeconds * 1000
            : 400 * 2 ** attempt;
        await this.sleep(waitMs);
      }
    }

    throw lastError ?? new AiError(503, "AI_UNAVAILABLE", "The AI provider failed.");
  }

  private validateAnswer(raw: string | undefined, { message, language }: AskInput): string {
    // The answer box shows plain text, so drop Markdown bold/heading markers.
    const answer = (raw ?? "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .trim();

    if (!answer || answer.length > 6000) {
      throw new AiError(
        502,
        "AI_INVALID_RESPONSE",
        "The AI provider returned an unusable answer."
      );
    }

    const unknownRoute = unknownRouteMention(answer, this.allowedRouteNumbers);
    if (unknownRoute) {
      // The user asked about this route, so the truthful answer is known
      // whatever the model wrote. A route it brought up by itself is an error.
      if (asksAboutRoute(message, unknownRoute)) {
        return routeNotVerifiedAnswer(unknownRoute, this.allowedRouteNumbers, language);
      }
      throw new AiError(
        502,
        "AI_INVALID_RESPONSE",
        "The AI answer mentioned a route outside the verified dataset."
      );
    }

    return language === "en" ? replacePlaceNamesWithEnglish(answer) : answer;
  }
}
