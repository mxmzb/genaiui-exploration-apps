// #region genui - Canvas route: persistent A2UI surface + chat with status-only A2UI rendering
import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CopilotKit, CopilotChat, type ReactActivityMessageRenderer } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { apartmentCatalog } from "../lib/a2ui-catalog/renderers";
import { Canvas } from "../components/Canvas";

function SurfaceStatus() {
  return (
    <div className="rounded-lg bg-[var(--sand)] px-3 py-2 text-xs text-[var(--sea-ink-soft)]">
      Canvas updated
    </div>
  );
}

export const Route = createFileRoute("/canvas")({ component: CanvasApp });

function CanvasApp() {
  const activityRenderers: ReactActivityMessageRenderer<any>[] = useMemo(
    () => [
      {
        activityType: "a2ui-surface",
        content: z.any(),
        render: SurfaceStatus,
      },
    ],
    [],
  );

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      a2ui={{ catalog: apartmentCatalog }}
      useSingleEndpoint={false}
      renderActivityMessages={activityRenderers}
    >
      <main className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 border-r border-[var(--line)]">
          <Canvas />
        </div>
        <div className="flex w-96 flex-col">
          <CopilotChat className="flex-1" />
        </div>
      </main>
    </CopilotKit>
  );
}
// #endregion genui
