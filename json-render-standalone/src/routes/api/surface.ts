// #region genui - json-render surface API route. Same shape as /api/chat, but uses the surface-mode system prompt that instructs the model to render a single self-contained view per response (the UI replaces, never appends).
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getSurfaceSystemPrompt } from "../../lib/catalog";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };
const conversations = new Map<string, ChatMsg[]>();

export const Route = createFileRoute("/api/surface")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { message, sessionId } = (await request.json()) as {
          message: string;
          sessionId: string;
        };

        if (!conversations.has(sessionId)) {
          conversations.set(sessionId, [
            { role: "system", content: getSurfaceSystemPrompt() },
          ]);
        }
        const history = conversations.get(sessionId)!;
        history.push({ role: "user", content: message });

        const result = streamText({
          model: openai(process.env.MODEL ?? "gpt-4.1"),
          messages: history,
          temperature: 0.3,
          onFinish: ({ text }) => {
            history.push({ role: "assistant", content: text });
          },
        });

        return result.toTextStreamResponse();
      },
    },
  },
});
// #endregion genui
