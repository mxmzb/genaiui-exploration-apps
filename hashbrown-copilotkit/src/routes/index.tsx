// #region genui - Chat route: CopilotKit wrapping hashbrown-powered chat with structured output
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { s } from "@hashbrownai/core";
import { useHashbrownKit } from "#/lib/chat-kit";
import { ChatView } from "#/components/ChatView";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint={false}>
      <WithHashbrownSchema>
        <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col">
          <ChatView />
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
