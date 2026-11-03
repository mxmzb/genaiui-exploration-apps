// #region genui - The chat endpoint delegates generation to the server-only handler.
import { createFileRoute } from "@tanstack/react-router";
import { generateUI } from "../../lib/generate-ui";
export const Route = createFileRoute("/api/chat")({
  server: { handlers: { POST: ({ request }) => generateUI(request) } },
});
// #endregion genui
