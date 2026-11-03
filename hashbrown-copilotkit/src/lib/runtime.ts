import {
  BuiltInAgent,
  CopilotRuntime,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { responseSchema } from "./catalog";
import { getSystemPrompt } from "./prompts";
import type { Apartment } from "./apartment-data";

// The app and replay/live benchmark use this exact agent/runtime factory.
export function createApartmentRuntime(
  options: {
    records?: Apartment[];
    today?: string;
    fetch?: typeof fetch;
    model?: string;
    provider?: string;
  } = {},
) {
  const provider = options.provider ?? process.env.OPENROUTER_PROVIDER ?? "azure/eu";
  const modelId = options.model ?? process.env.MODEL ?? "openai/gpt-5.4";
  const model = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY ?? "replay-only",
        fetch: options.fetch,
      }).chat(modelId, {
        extraBody: {
          provider: {
            zdr: true,
            allow_fallbacks: false,
            ...(provider ? { only: [provider] } : {}),
          },
          reasoning: { effort: "low" },
          response_format: { type: "json_schema", json_schema: { name: "apartment_ui", strict: true, schema: responseSchema } },
        },
      });
  return new CopilotRuntime({
    agents: { default: new BuiltInAgent({ model, prompt: getSystemPrompt(options.records, options.today), maxSteps: 1, maxRetries: 0, maxOutputTokens: 16000 }) },
    runner: new InMemoryAgentRunner(),
  });
}
