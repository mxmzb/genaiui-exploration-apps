// #region genui - json-render chat API route. Streams the model's JSONL spec output back to the client as a plain text stream; the client's useUIStream hook parses each line into a json-render patch.
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getChatSystemPrompt } from "../../lib/catalog";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };
const conversations = new Map<string, ChatMsg[]>();

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { message, sessionId } = (await request.json()) as {
          message: string;
          sessionId: string;
        };

        if (!conversations.has(sessionId)) {
          conversations.set(sessionId, [
            { role: "system", content: getChatSystemPrompt() },
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

        // Plain text stream — no createJsonRenderTransform needed because the
        // client uses useUIStream, which parses raw JSONL lines directly. The
        // json-render UI message stream transforms (pipeJsonRender /
        // createJsonRenderTransform) are only needed when piping through the AI
        // SDK's UI message stream protocol for the AI SDK useChat hook.
        return result.toTextStreamResponse();
      },
    },
  },
});
// #endregion genui
