import {
  BuiltInAgent,
  CopilotRuntime,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getSystemPrompt } from "./prompts";
import { variants, variantId } from "./variants";
import type { Apartment } from "./apartment-data";

// The app and replay/live benchmark use this exact agent/runtime factory.
export function createApartmentRuntime(
  options: {
    records?: Apartment[];
    today?: string;
    fetch?: typeof fetch;
    model?: string;
    provider?: string;
    openRouter?: boolean;
  } = {},
) {
  const throughOpenRouter =
    options.openRouter ?? process.env.MODEL_PROVIDER === "openrouter";
  const provider = options.provider ?? process.env.OPENROUTER_PROVIDER;
  const modelId = options.model ?? process.env.MODEL ?? "openai/gpt-5.4";
  const model = throughOpenRouter
    ? createOpenRouter({
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
        },
      })
    : modelId;
  return new CopilotRuntime({
    agents: Object.fromEntries(
      variants.map((variant) => [
        variantId(variant),
        new BuiltInAgent({
          model,
          prompt: getSystemPrompt(variant, options.records, options.today),
          maxSteps: 1,
          maxRetries: 0,
          maxOutputTokens: 16000,
          providerOptions: throughOpenRouter
            ? undefined
            : { openai: { reasoningEffort: "low" } },
        }),
      ]),
    ),
    runner: new InMemoryAgentRunner(),
  });
}
