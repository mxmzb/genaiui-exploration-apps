import { createFileRoute } from "@tanstack/react-router";
import OpenAI from "openai";
import { SURFACE_SYSTEM_PROMPT } from "../../lib/surface-prompt";

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
            { role: "system", content: SURFACE_SYSTEM_PROMPT },
          ]);
        }
        const history = conversations.get(sessionId)!;
        history.push({ role: "user", content: message });

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });

        const stream = await openai.chat.completions.create({
          model: "gpt-5.4",
          stream: true,
          temperature: 0.3,
          messages: history,
        });

        let fullAssistantResponse = "";

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                fullAssistantResponse += content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(content)}\n\n`)
                );
              }
            }
            history.push({
              role: "assistant",
              content: fullAssistantResponse,
            });
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
