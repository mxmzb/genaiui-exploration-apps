// #region genui - The workspace displays one persistent interface backed by the agent conversation.
import { createFileRoute } from "@tanstack/react-router";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { Canvas } from "../components/Canvas";
export const Route = createFileRoute("/canvas")({
  component: () => (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      useSingleEndpoint={false}
      enableInspector={false}
    >
      <Canvas />
    </CopilotKit>
  ),
});
// #endregion genui
