// #region genui - Custom chat UI using CopilotKit hooks + Hashbrown structured output rendering
import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, memo } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useJsonParser } from "@hashbrownai/react";
import { useHashbrownKit } from "#/lib/chat-kit";

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

const HashbrownMessage = memo(function HashbrownMessage({
  content,
}: {
  content: string;
}) {
  const kit = useHashbrownKit();
  const { value } = useJsonParser(content, kit.schema);
  if (!value) return null;
  return (
    <div data-testid="copilot-assistant-message">
      {kit.render(value)}
    </div>
  );
});

function isJsonContent(text: string): boolean {
  return text.trimStart().startsWith("{");
}

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
    return agent.messages.filter((m) => {
      const text = getMessageText(m).trim();
      if (!text) return false;
      if (m.role === "user") return true;
      if (m.role === "assistant" && isJsonContent(text)) return true;
      return false;
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
            const isLast = i === visibleMessages.length - 1;
            const stableKey = msg.id ?? String(i);

            if (msg.role === "user") {
              return (
                <div key={stableKey} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-[var(--lagoon)] px-4 py-3 text-white">
                    <p className="text-sm">{text}</p>
                  </div>
                </div>
              );
            }

            if (canvasMode && isJsonContent(text)) {
              return (
                <div key={stableKey} className="flex justify-start">
                  <div className="rounded-lg bg-[var(--sand)] px-3 py-2 text-xs text-[var(--sea-ink-soft)]">
                    {agent.isRunning && isLast ? "Updating canvas..." : "Canvas updated"}
                  </div>
                </div>
              );
            }

            return (
              <div key={stableKey} className="flex justify-start">
                <div className="island-shell max-w-[85%] rounded-2xl px-4 py-3">
                  <HashbrownMessage content={text} />
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
