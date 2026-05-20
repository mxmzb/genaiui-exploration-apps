// #region genui - Custom chat UI using CopilotKit hooks + OpenUI Renderer for assistant messages
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { Renderer } from "@openuidev/react-lang";
import "@openuidev/react-ui/components.css";
import { apartmentLibrary } from "../lib/apartment-library";
import { toolProvider } from "../lib/tool-provider";
import { sanitizeOpenUIOutput } from "../lib/openui-sanitizer";

const SUGGESTIONS = [
  "Show me apartments",
  "Show me 2-bedroom apartments",
  "What's available in Arts District?",
  "Show me apartments under $2,500",
  "Show me an apartment dashboard",
];

export function isOpenUILang(text: string): boolean {
  return /^\s*root\s*=\s*/m.test(text);
}

function getMessageText(m: { content?: unknown }): string {
  if (typeof m.content === "string") return m.content;
  return "";
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
    console.log(`[DEBUG] isRunning=${agent.isRunning} messages(${agent.messages.length}):`);
    agent.messages.forEach((m, i) => {
      const text = getMessageText(m);
      const preview = text.slice(0, 60).replace(/\n/g, "\\n");
      console.log(`  [${i}] role=${m.role} id=${String(m.id ?? "").slice(0, 8)} ui=${isOpenUILang(text)} len=${text.length} "${preview}"`);
    });
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

  const handleAction = useCallback(
    (action: unknown) => {
      const event = action as {
        type?: string;
        humanFriendlyMessage?: string;
        formState?: Record<string, unknown>;
      };
      const actionStr = event.humanFriendlyMessage ?? "";
      const parts = actionStr.split(":");
      const [prefix, verb, id] = parts;

      if (prefix === "action") {
        switch (verb) {
          case "view":
            sendMessage(`Show me details for apartment ${id}`);
            break;
          case "tour":
            sendMessage(`I'd like to schedule a tour for apartment ${id}`);
            break;
          case "back":
            sendMessage("Show me the apartment listings again");
            break;
          default:
            console.log("Unhandled action:", actionStr);
        }
      } else if (prefix === "submit") {
        const apartmentId = id || verb;
        const formData = event.formState ?? {};
        const unwrap = (v: unknown): unknown =>
          v && typeof v === "object" && !Array.isArray(v) && "value" in (v as Record<string, unknown>)
            ? (v as Record<string, unknown>).value
            : v;
        const fields = Object.values(formData)
          .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
          .flatMap((v) => Object.entries(v));
        const formSummary = fields
          .map(([k, v]) => [k, unwrap(v)] as const)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        const msg = formSummary
          ? `Confirm my tour request for apartment ${apartmentId}. Here are my details: ${formSummary}`
          : `Confirm my tour request for apartment ${apartmentId}`;
        sendMessage(msg);
      }
    },
    [sendMessage],
  );

  const visibleMessages = useMemo(() => {
    const candidates = agent.messages.filter((m) => {
      const text = getMessageText(m).trim();
      if (!text) return false;
      if (m.role === "user" || m.role === "assistant") return true;
      if (m.role === "tool" && isOpenUILang(text)) return true;
      return false;
    });

    // AG-UI may surface the same tool result in multiple message slots
    // within a single turn. Deduplicate within each turn (bounded by user
    // messages) but preserve OpenUI Lang from previous turns.
    return candidates.filter((m, i) => {
      const text = getMessageText(m);
      if (!isOpenUILang(text)) return true;
      for (let j = i + 1; j < candidates.length; j++) {
        if (candidates[j].role === "user") break;
        if (isOpenUILang(getMessageText(candidates[j]))) return false;
      }
      return true;
    });
  }, [agent.messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {visibleMessages.length === 0 && !agent.isRunning && (
          <div className="flex h-full items-center justify-center text-[var(--sea-ink-soft)]">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
              {canvasMode ? (
                <p className="text-sm">Search for apartments using the chat below.</p>
              ) : (
                <>
                  <p className="mb-3 text-sm">Try one of these:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setInput(s)}
                        className="rounded-full border border-[var(--line)] bg-white/60 px-3 py-1.5 text-xs font-medium text-[var(--sea-ink)] transition hover:border-[var(--lagoon)] hover:bg-white/90"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {visibleMessages.map((msg, i) => {
          const text = getMessageText(msg);
          const isUI = isOpenUILang(text);
          const isLast = i === visibleMessages.length - 1;

          // Stable key for OpenUI Lang messages: use turn index so the
          // key survives AG-UI restructuring (assistant→tool role change)
          let stableKey = msg.id ?? String(i);
          if (isUI) {
            let turnIndex = 0;
            for (let j = 0; j < i; j++) {
              if (visibleMessages[j].role === "user") turnIndex++;
            }
            stableKey = `openui-turn-${turnIndex}`;
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

          return (
            <div
              key={stableKey}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl bg-[var(--lagoon)] px-4 py-3 text-white">
                  <p className="text-sm">{text}</p>
                </div>
              ) : isUI ? (
                <div className="w-full">
                  <Renderer
                    library={apartmentLibrary}
                    response={sanitizeOpenUIOutput(text)}
                    isStreaming={isLast && agent.isRunning}
                    onAction={handleAction}
                    toolProvider={toolProvider}
                  />
                </div>
              ) : (
                <div className="island-shell max-w-[85%] rounded-2xl px-4 py-3">
                  <p className="text-sm">{text}</p>
                </div>
              )}
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
  );
}
// #endregion genui
