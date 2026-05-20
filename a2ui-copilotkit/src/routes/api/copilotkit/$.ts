// #region genui - CopilotKit runtime connecting to Python LangGraph agent
import { createFileRoute } from "@tanstack/react-router";
import {
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { LangGraphHttpAgent } from "@copilotkit/runtime/langgraph";

const agent = new LangGraphHttpAgent({
  url: process.env.AGENT_URL || "http://localhost:8123",
});

const runtime = new CopilotRuntime({
  agents: { default: agent },
  runner: new InMemoryAgentRunner(),
  a2ui: {
    injectA2UITool: false,
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const Route = createFileRoute("/api/copilotkit/$")({
  server: {
    handlers: {
      POST: async ({ request }) => handler(request),
      GET: async ({ request }) => handler(request),
    },
  },
});
// #endregion genui
