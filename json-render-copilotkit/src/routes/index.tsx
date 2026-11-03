// #region genui - CopilotKit connects the chat to the local runtime.
import { createFileRoute } from "@tanstack/react-router";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { ChatView } from "../components/ChatView";
export const Route = createFileRoute("/")({
  component: () => (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      useSingleEndpoint={false}
      enableInspector={false}
    >
      <ChatView />
    </CopilotKit>
  ),
});
// #endregion genui
