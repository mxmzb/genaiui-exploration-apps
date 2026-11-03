// #region genui - The workspace uses the same stream with a prompt for complete replacement views.
import { createFileRoute } from "@tanstack/react-router";
import { generateUI } from "../../lib/generate-ui";
export const Route = createFileRoute("/api/surface")({
  server: { handlers: { POST: ({ request }) => generateUI(request, true) } },
});
// #endregion genui
