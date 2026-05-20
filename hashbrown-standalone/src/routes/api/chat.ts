import { createFileRoute } from "@tanstack/react-router";
import { HashbrownOpenAI } from "@hashbrownai/openai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();

        const stream = HashbrownOpenAI.stream.text({
          apiKey: process.env.OPENAI_API_KEY!,
          request: body,
        });

        return new Response(
          new ReadableStream({
            async start(controller) {
              for await (const chunk of stream) {
                controller.enqueue(chunk);
              }
              controller.close();
            },
          }),
          {
            headers: { "Content-Type": "application/octet-stream" },
          }
        );
      },
    },
  },
});
