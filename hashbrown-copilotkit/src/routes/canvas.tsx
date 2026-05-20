// #region genui - Canvas route: persistent hashbrown surface + chat side panel
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { s } from "@hashbrownai/core";
import { useHashbrownKit } from "#/lib/chat-kit";
import { Canvas } from "#/components/Canvas";
import { ChatView } from "#/components/ChatView";

export const Route = createFileRoute("/canvas")({ component: CanvasPage });

function CanvasPage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
      <WithHashbrownSchema>
        <main className="flex h-[calc(100vh-4rem)]">
          <div className="flex-1 border-r border-[var(--line)]">
            <Canvas />
          </div>
          <div className="flex w-96 flex-col">
            <ChatView canvasMode />
          </div>
        </main>
      </WithHashbrownSchema>
    </CopilotKit>
  );
}

function WithHashbrownSchema({ children }: { children: ReactNode }) {
  const kit = useHashbrownKit();
  useAgentContext({ description: "output_schema", value: s.toJsonSchema(kit.schema) });
  return <>{children}</>;
}
// #endregion genui
