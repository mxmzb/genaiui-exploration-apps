// #region genui - Canvas route: persistent OpenUI surface + chat side panel
import { createFileRoute } from "@tanstack/react-router";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { Canvas } from "../components/Canvas";
import { ChatView } from "../components/ChatView";

export const Route = createFileRoute("/canvas")({ component: CanvasApp });

function CanvasApp() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
      <main className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 border-r border-[var(--line)]">
          <Canvas />
        </div>
        <div className="flex w-96 flex-col">
          <ChatView canvasMode />
        </div>
      </main>
    </CopilotKit>
  );
}
// #endregion genui
