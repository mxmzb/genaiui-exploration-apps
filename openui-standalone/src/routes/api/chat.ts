import { createFileRoute } from "@tanstack/react-router";
import { getSystemPrompt } from "../../../../openui-copilotkit/src/lib/prompts";
export const Route = createFileRoute("/api/chat")({ server: { handlers: { POST: async ({ request }) => {
  const body = await request.json();
  const openRouter = process.env.MODEL_PROVIDER === "openrouter";
  const response = await fetch(openRouter ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions", {
    method: "POST", signal: request.signal,
    headers: { "content-type": "application/json", authorization: `Bearer ${openRouter ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: process.env.MODEL ?? (openRouter ? "openai/gpt-5.4" : "gpt-5.4"), messages: [{ role: "system", content: getSystemPrompt() }, ...body.messages], stream: true, stream_options: { include_usage: true }, max_completion_tokens: 16000, ...(openRouter ? { provider: { zdr: true, allow_fallbacks: false, only: [process.env.OPENROUTER_PROVIDER ?? "azure/eu"] }, reasoning: { effort: "low" } } : { reasoning_effort: "low" }) }),
  });
  if (!response.ok) return new Response("The model request failed. Please try again.", { status: response.status });
  return new Response(response.body, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
} } } });
