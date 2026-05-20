// #region genui - Persistent A2UI canvas: extracts operations from CopilotKit agent messages, renders outside chat
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  A2UIProvider,
  A2UIRenderer,
  useA2UIActions,
  initializeDefaultCatalog,
  injectStyles,
} from "@copilotkit/a2ui-renderer";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { apartmentCatalog } from "../lib/a2ui-catalog/renderers";

const A2UI_OPS_KEY = "a2ui_operations";

let a2uiReady = false;
function ensureA2UI() {
  if (!a2uiReady) {
    initializeDefaultCatalog();
    injectStyles();
    a2uiReady = true;
  }
}

function extractSurfaceId(ops: any[]): string | null {
  for (const op of ops) {
    const sid =
      op?.createSurface?.surfaceId ??
      op?.updateComponents?.surfaceId ??
      op?.updateDataModel?.surfaceId;
    if (sid) return sid;
  }
  return null;
}

function SurfaceMessageProcessor({
  operations,
  surfaceId,
}: {
  operations: any[];
  surfaceId: string;
}) {
  const { processMessages, getSurface } = useA2UIActions();
  const lastHashRef = useRef("");

  useEffect(() => {
    if (!operations.length) return;
    const hash = JSON.stringify(operations);
    if (hash === lastHashRef.current) return;
    lastHashRef.current = hash;

    const isExisting = !!getSurface(surfaceId);
    const ops = isExisting
      ? operations.filter((op: any) => !op?.createSurface)
      : operations;

    if (ops.length) {
      processMessages(ops);
    }
  }, [operations, processMessages, getSurface, surfaceId]);

  return null;
}

function CanvasInner() {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();

  const { latestOperations, surfaceId } = useMemo(() => {
    if (!agent?.messages) return { latestOperations: [], surfaceId: null };
    for (let i = agent.messages.length - 1; i >= 0; i--) {
      const msg = agent.messages[i] as any;
      if (msg.role === "activity" && msg.activityType === "a2ui-surface") {
        const ops = msg.content?.[A2UI_OPS_KEY] ?? [];
        const sid = extractSurfaceId(ops);
        console.log(`[A2UI-Canvas] activity[${i}] ops=${ops.length} surfaceId=${sid} msgCount=${agent.messages.length}`);
        return { latestOperations: ops, surfaceId: sid };
      }
    }
    return { latestOperations: [], surfaceId: null };
  }, [agent?.messages]);

  const handleAction = useCallback(
    async (action: any) => {
      if (!agent) return;
      try {
        copilotkit.setProperties({
          ...copilotkit.properties,
          a2uiAction: action,
        });
        await (copilotkit as any).runAgent({ agent });
      } finally {
        if (copilotkit.properties) {
          const { a2uiAction: _, ...rest } = copilotkit.properties as any;
          copilotkit.setProperties(rest);
        }
      }
    },
    [agent, copilotkit],
  );

  const hasContent = latestOperations.length > 0 && !!surfaceId;

  return (
    <A2UIProvider onAction={handleAction} catalog={apartmentCatalog}>
      {surfaceId && (
        <SurfaceMessageProcessor
          operations={latestOperations}
          surfaceId={surfaceId}
        />
      )}
      {hasContent ? (
        <A2UIRenderer
          surfaceId={surfaceId!}
          className="a2ui-canvas-surface"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-[var(--sea-ink-soft)]">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
            <p className="text-sm">
              Search for apartments by neighborhood, bedrooms, price, or
              amenities.
            </p>
          </div>
        </div>
      )}
    </A2UIProvider>
  );
}

export function Canvas() {
  ensureA2UI();

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <CanvasInner />
    </div>
  );
}
// #endregion genui
