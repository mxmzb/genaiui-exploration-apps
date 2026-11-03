import { createFileRoute } from "@tanstack/react-router";
import { HashbrownOpenAI } from "@hashbrownai/openai";
import { getSystemPrompt } from "../../../../hashbrown-copilotkit/src/lib/prompts";
import { responseSchema } from "../../../../hashbrown-copilotkit/src/lib/catalog";
export const Route = createFileRoute("/api/chat")({ server: { handlers: { POST: async ({ request }) => {
  const body = await request.json();
  // Server owns the facts, system prompt and allowed schema; never trust client overrides.
  const input = { ...body, tools: [], messages: [{ id: "system", role: "system", content: getSystemPrompt() }, ...body.messages.filter((m: { role: string }) => m.role !== "system")], forwardedProps: { hashbrown: { ui: true, responseSchema } } };
  const stream = HashbrownOpenAI.stream.text({
    apiKey: process.env.OPENROUTER_API_KEY!, baseURL: process.env.HASHBROWN_API_BASE ?? "https://openrouter.ai/api/v1", model: process.env.MODEL ?? "openai/gpt-5.4", input, signal: request.signal,
    transformRequestOptions: options => ({ ...options, max_output_tokens: 16000, reasoning: { effort: "low" }, provider: { only: [process.env.OPENROUTER_PROVIDER ?? "azure/eu"], allow_fallbacks: false, zdr: true } }),
  });
  return new Response(new ReadableStream({ async start(controller) {
    try { for await (const event of stream) controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)); controller.close(); } catch(e) { controller.error(e); }
  } }), { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
} } } });
