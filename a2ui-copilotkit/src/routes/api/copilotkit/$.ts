import { createFileRoute } from "@tanstack/react-router";
import { createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { createApartmentRuntime } from "../../../lib/runtime";

const handler = createCopilotRuntimeHandler({
  runtime: createApartmentRuntime(),
  basePath: "/api/copilotkit",
});
export const Route = createFileRoute("/api/copilotkit/$")({
  server: {
    handlers: {
      POST: ({ request }) => handler(request),
      GET: ({ request }) => handler(request),
    },
  },
});
