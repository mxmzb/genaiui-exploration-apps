// #region genui - Validate the chat request, stream JSONL, and surface provider failures before returning HTTP 200.
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { getSystemPrompt } from "./prompts";

const conversation = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

// Server-side overrides let the benchmark exercise this same generation path.
export type GenerationOptions = {
  model?: string;
  baseURL?: string;
  apiKey?: string;
  fetch?: typeof fetch;
  systemPrompt?: string;
  onFinish?: Parameters<typeof streamText>[0]["onFinish"];
};

export async function generateUI(
  request: Request,
  surface = false,
  options: GenerationOptions = {},
) {
  const body = conversation.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return Response.json(
      { error: "Please send a conversation." },
      { status: 400 },
    );
  const useOpenRouter = process.env.MODEL_PROVIDER === "openrouter";
  const apiKey = options.apiKey ?? (useOpenRouter
    ? process.env.OPENROUTER_API_KEY
    : process.env.OPENAI_API_KEY);
  if (!apiKey) {
    return Response.json(
      {
        error: `Add ${useOpenRouter ? "OPENROUTER_API_KEY" : "OPENAI_API_KEY"} to the app's .env file and restart the server.`,
      },
      { status: 503 },
    );
  }
  const openai = createOpenAI({
    apiKey,
    baseURL: options.baseURL ?? (useOpenRouter
      ? "https://openrouter.ai/api/v1"
      : process.env.OPENAI_BASE_URL),
    fetch: options.fetch,
  });
  const result = streamText({
    model: openai.chat(
      options.model ?? process.env.MODEL ?? (useOpenRouter ? "openai/gpt-4.1" : "gpt-4.1"),
    ),
    instructions: options.systemPrompt ?? getSystemPrompt(surface),
    messages: body.data.messages,
    temperature: 0.3,
    maxRetries: 0,
    maxOutputTokens: 12000,
    abortSignal: AbortSignal.any([
      request.signal,
      AbortSignal.timeout(120_000),
    ]),
    onError: () => {}, // The HTTP response below reports the failure to the client.
    onFinish: options.onFinish,
  });
  const reader = result.fullStream.getReader();
  async function nextText(): Promise<string | null> {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return null;
      if (value.type === "error") throw value.error;
      if (value.type === "text-delta") return value.text;
    }
  }
  try {
    const first = await nextText();
    if (first === null)
      throw new Error("The model returned no interface. Please try again.");
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(first));
        },
        async pull(controller) {
          try {
            const text = await nextText();
            if (text === null) controller.close();
            else controller.enqueue(encoder.encode(text));
          } catch {
            controller.error(
              new Error(
                "The model response was interrupted. Please try again.",
              ),
            );
          }
        },
        cancel() {
          return reader.cancel();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  } catch (error) {
    await reader.cancel();
    const detail =
      error instanceof Error ? error.message : "The model is unavailable.";
    return Response.json({ error: detail }, { status: 502 });
  }
}
// #endregion genui
