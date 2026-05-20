// #region genui - Custom chat UI using CopilotKit hooks + json-render spec rendering
import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, memo } from "react";
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

type SendFn = (content: string) => void;
export const ChatActionContext = createContext<SendFn | null>(null);
export function useChatAction() {
  const send = useContext(ChatActionContext);
  if (!send) throw new Error("useChatAction must be used inside ChatActionContext");
  return send;
}

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

function isJsonRenderContent(text: string): boolean {
  return text.trimStart().startsWith("{");
}

const JsonRenderMessage = memo(function JsonRenderMessage({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  const send = useChatAction();
  const spec = useMemo(() => parseJsonRenderSpec(content), [content]);
  if (!spec) return null;

  const actionHandlers = {
    view_apartment: async (params: Record<string, unknown>) => {
      const id = String(params?.apartmentId ?? "");
      send(`Show me details for apartment ${id}`);
    },
    schedule_tour: async (params: Record<string, unknown>) => {
      const id = String(params?.apartmentId ?? "");
      send(`I'd like to schedule a tour for apartment ${id}`);
    },
    back_to_results: async () => {
      send("Show me the previous search results again");
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
      send(msg);
    },
  };

  return (
    <StateProvider>
      <VisibilityProvider>
        <ActionProvider handlers={actionHandlers}>
          <Renderer spec={spec} registry={registry} loading={isStreaming} />
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
});

interface ChatViewProps {
  canvasMode?: boolean;
}

export function ChatView({ canvasMode = false }: ChatViewProps) {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agent.messages, agent.isRunning]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || agent.isRunning) return;
      agent.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      });
      await copilotkit.runAgent({ agent });
    },
    [agent, copilotkit],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      const text = input.trim();
      setInput("");
      sendMessage(text);
    },
    [input, sendMessage],
  );

  const visibleMessages = useMemo(() => {
    const candidates = agent.messages.filter((m) => {
      const text = getMessageText(m).trim();
      if (!text) return false;
      if (m.role === "user" || m.role === "assistant") return true;
      if (m.role === "tool" && isJsonRenderContent(text)) return true;
      return false;
    });

    // AG-UI may surface the same tool result in multiple message slots
    // within a single turn. Deduplicate within each turn (bounded by user
    // messages) but preserve json-render content from previous turns.
    return candidates.filter((m, i) => {
      const text = getMessageText(m);
      if (!isJsonRenderContent(text)) return true;
      for (let j = i + 1; j < candidates.length; j++) {
        if (candidates[j].role === "user") break;
        if (isJsonRenderContent(getMessageText(candidates[j]))) return false;
      }
      return true;
    });
  }, [agent.messages]);

  return (
    <ChatActionContext value={sendMessage}>
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {visibleMessages.length === 0 && !agent.isRunning && (
            <div className="flex h-full items-center justify-center text-[var(--sea-ink-soft)]">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
                <p className="text-sm">
                  Try: &quot;Show me 2-bedroom apartments&quot; or &quot;What&apos;s
                  available in Midtown?&quot;
                </p>
              </div>
            </div>
          )}

          {visibleMessages.map((msg, i) => {
            const text = getMessageText(msg);
            const isUI = isJsonRenderContent(text);
            const isLast = i === visibleMessages.length - 1;

            // Stable key for json-render messages: use turn index so the
            // key survives AG-UI restructuring (assistant->tool role change)
            let stableKey = msg.id ?? String(i);
            if (isUI) {
              let turnIndex = 0;
              for (let j = 0; j < i; j++) {
                if (visibleMessages[j].role === "user") turnIndex++;
              }
              stableKey = `jsonrender-turn-${turnIndex}`;
            }

            if (msg.role === "user") {
              return (
                <div key={stableKey} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-[var(--lagoon)] px-4 py-3 text-white">
                    <p className="text-sm">{text}</p>
                  </div>
                </div>
              );
            }

            if (canvasMode && isUI) {
              return (
                <div key={stableKey} className="flex justify-start">
                  <div className="rounded-lg bg-[var(--sand)] px-3 py-2 text-xs text-[var(--sea-ink-soft)]">
                    {agent.isRunning && isLast ? "Updating canvas..." : "Canvas updated"}
                  </div>
                </div>
              );
            }

            if (isUI) {
              return (
                <div key={stableKey} className="flex justify-start">
                  <div className="island-shell max-w-[85%] rounded-2xl px-4 py-3">
                    <JsonRenderMessage
                      content={text}
                      isStreaming={agent.isRunning && isLast}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={stableKey} className="flex justify-start">
                <div className="island-shell max-w-[85%] rounded-2xl px-4 py-3">
                  <p className="text-sm">{text}</p>
                </div>
              </div>
            );
          })}

          {agent.isRunning && visibleMessages[visibleMessages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="island-shell rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:0ms]" />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:150ms]" />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-[var(--line)] bg-[var(--surface-strong)] p-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about apartments..."
              className="flex-1 rounded-xl border border-[var(--line)] bg-white/50 px-4 py-2.5 text-sm outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[var(--lagoon)]/20"
              disabled={agent.isRunning}
            />
            <button
              type="submit"
              disabled={agent.isRunning || !input.trim()}
              className="rounded-xl bg-[var(--lagoon)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--lagoon-deep)] disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </ChatActionContext>
  );
}
// #endregion genui
