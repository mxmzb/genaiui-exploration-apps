// #region genui - Chat route: CopilotKit wrapping json-render chat UI
import { createFileRoute } from "@tanstack/react-router";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { ChatView } from "#/components/ChatView";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
      <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col">
        <ChatView />
      </main>
    </CopilotKit>
  );
}
// #endregion genui
