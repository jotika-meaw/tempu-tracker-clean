import OpenAI from "openai";
import type { MetaClient, MetaFunctionCall } from "./service";

type MetaClientOptions = {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
};

export function createMetaClient(options: MetaClientOptions): MetaClient {
  const client = new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseUrl,
    timeout: options.timeoutMs,
    maxRetries: 0,
  });

  return {
    async create(params) {
      const response = await client.responses.create({
        model: params.model,
        instructions: params.instructions,
        input: params.input as OpenAI.Responses.ResponseInput | string,
        store: params.store,
        max_output_tokens: params.max_output_tokens,
        ...(params.tools ? { tools: params.tools as OpenAI.Responses.Tool[] } : {}),
      });

      const output = (response.output ?? []) as unknown[];
      const functionCalls: MetaFunctionCall[] = [];
      for (const item of output) {
        const candidate = item as Partial<MetaFunctionCall> & { type?: unknown };
        if (
          candidate.type === "function_call" &&
          typeof candidate.call_id === "string" &&
          typeof candidate.name === "string"
        ) {
          functionCalls.push({
            type: "function_call",
            call_id: candidate.call_id,
            name: candidate.name,
            arguments: typeof candidate.arguments === "string" ? candidate.arguments : "{}",
          });
        }
      }

      return { output_text: response.output_text, output, function_calls: functionCalls };
    },
  };
}
