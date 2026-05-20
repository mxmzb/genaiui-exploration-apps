import { createFileRoute } from "@tanstack/react-router";
import OpenAI from "openai";
import { getSystemPrompt } from "../../lib/a2ui-prompt";

// #region genui - Stateful surface mode: conversation history per session with batch/progressive toggle
type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

const conversations = new Map<
  string,
  { messages: ChatMsg[]; mode: "batch" | "progressive" | "per-field" }
>();

export const Route = createFileRoute("/api/surface")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { message, sessionId, mode } = (await request.json()) as {
          message: string;
          sessionId: string;
          mode: "batch" | "progressive" | "per-field";
        };

        const conv = conversations.get(sessionId);
        if (!conv || conv.mode !== mode) {
          conversations.set(sessionId, {
            mode,
            messages: [{ role: "system", content: getSystemPrompt(mode) }],
          });
        }
        const history = conversations.get(sessionId)!.messages;
        history.push({ role: "user", content: message });

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const stream = await openai.chat.completions.create({
          model: "gpt-4.1",
          stream: true,
          temperature: 0.3,
          messages: history,
        });

        let fullResponse = "";

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(content)}\n\n`)
                );
              }
            }
            history.push({ role: "assistant", content: fullResponse });
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
// #endregion genui
