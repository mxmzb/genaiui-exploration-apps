// #region genui - Persistent json-render canvas: renders latest assistant spec as a surface
import { useMemo, useCallback } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import {
  Renderer,
  StateProvider,
  ActionProvider,
  VisibilityProvider,
} from "@json-render/react";
import {
  parseSpecStreamLine,
  applySpecPatch,
  type Spec,
} from "@json-render/core";
import { registry } from "#/lib/registry";
import { ChatActionContext } from "#/components/ChatView";

function getMessageText(m: { content?: unknown }): string {
  if (typeof m.content === "string") return m.content;
  return "";
}

function parseJsonRenderSpec(text: string): Spec | null {
  const lines = text.trim().split("\n");
  let spec: Spec = { root: "", elements: {} };
  let parsed = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const patch = parseSpecStreamLine(trimmed);
    if (!patch) continue;
    spec = applySpecPatch(spec, patch);
    parsed = true;
  }

  return parsed && spec.root ? spec : null;
}

function CanvasRenderer({ content, sendMessage }: { content: string; sendMessage: SendFn }) {
  const spec = useMemo(() => parseJsonRenderSpec(content), [content]);
  if (!spec) return null;

  const actionHandlers = {
    view_apartment: async (params: Record<string, unknown>) => {
      sendMessage(`Show me details for apartment ${String(params?.apartmentId ?? "")}`);
    },
    schedule_tour: async (params: Record<string, unknown>) => {
      sendMessage(`I'd like to schedule a tour for apartment ${String(params?.apartmentId ?? "")}`);
    },
    back_to_results: async () => {
      sendMessage("Show me the previous search results again");
    },
    submit_tour: async (params: Record<string, unknown>) => {
      const id = String(params?.apartmentId ?? "");
      const form = document.querySelector(".tour-form");
      const inputs = form
        ? form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[name], textarea[name]")
        : [];
      const details = Array.from(inputs)
        .filter((el) => el.value && el.type !== "hidden")
        .map((el) => `${el.name}: ${el.value}`)
        .join(", ");
      const msg = details
        ? `Confirm my tour request for apartment ${id}. Here are my details: ${details}`
        : `Confirm my tour request for apartment ${id}`;
      sendMessage(msg);
    },
  };

  return (
    <StateProvider>
      <VisibilityProvider>
        <ActionProvider handlers={actionHandlers}>
          <Renderer spec={spec} registry={registry} loading={false} />
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}

type SendFn = (content: string) => void;

export function Canvas() {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();

  const latestContent = useMemo(() => {
    if (!agent?.messages) return "";
    for (let i = agent.messages.length - 1; i >= 0; i--) {
      const msg = agent.messages[i];
      const text = getMessageText(msg);
      if ((msg.role === "assistant" || msg.role === "tool") && text.trimStart().startsWith("{")) {
        return text;
      }
    }
    return "";
  }, [agent?.messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      agent.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      });
      await copilotkit.runAgent({ agent });
    },
    [agent, copilotkit],
  );

  return (
    <ChatActionContext value={sendMessage}>
      <div className="h-full overflow-y-auto p-6">
        {latestContent ? (
          <div className="mx-auto max-w-3xl">
            <CanvasRenderer content={latestContent} sendMessage={sendMessage} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--sea-ink-soft)]">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
              <p className="text-sm">
                Search for apartments by neighborhood, bedrooms, price, or amenities.
              </p>
            </div>
          </div>
        )}
      </div>
    </ChatActionContext>
  );
}
// #endregion genui
