// #region genui - Chat-only route: CopilotChat renders A2UI surfaces inline
import { createFileRoute } from "@tanstack/react-router";
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";
import { apartmentCatalog } from "../lib/a2ui-catalog/renderers";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      a2ui={{ catalog: apartmentCatalog }}
      useSingleEndpoint={false}
    >
      <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col">
        <CopilotChat className="flex-1" />
      </main>
    </CopilotKit>
  );
}
// #endregion genui
