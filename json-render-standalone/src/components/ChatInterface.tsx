// #region genui - json-render chat interface. Streams JSONL spec patches from /api/chat, applies them to a per-message Spec, and renders each spec via <Renderer />. Wraps every rendered spec in <StateProvider>/<ActionProvider> so emitted action bindings (view_apartment, schedule_tour, back_to_results, submit_tour) are intercepted and turned into synthesized follow-up user messages instead of being executed locally.
import { useState, useRef, useCallback, type FormEvent } from "react";
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
import { registry } from "../lib/registry";

interface ChatMessage {
  role: "user" | "assistant";
  content?: string;
  spec?: Spec;
}

/**
 * Stream the chat response from /api/chat. The route returns a plain text
 * stream of JSONL spec lines (one RFC 6902 patch per line), so we parse each
 * line with `parseSpecStreamLine` and apply it with `applySpecPatch` to
 * progressively build the spec. We use a manual fetch instead of
 * `useUIStream` because that hook posts `{ prompt, context, currentSpec }` to
 * the API, while our chat API expects `{ message, sessionId }` to maintain a
 * server-side conversation history.
 */
async function streamChat(
  userMessage: string,
  sessionId: string,
  onSpec: (spec: Spec) => void,
  onDone: (finalSpec: Spec) => void,
  onError: (error: string) => void
) {
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, sessionId }),
    });
  } catch (err) {
    onError(err instanceof Error ? err.message : String(err));
    return;
  }

  if (!response.ok || !response.body) {
    onError(`Request failed: ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let spec: Spec = { root: "", elements: {} };

  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const patch = parseSpecStreamLine(trimmed);
    if (!patch) return;
    spec = applySpecPatch(spec, patch);
    onSpec({ ...spec, elements: { ...spec.elements } });
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) consumeLine(line);
  }
  if (buffer) consumeLine(buffer);

  onDone(spec);
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  const sendMessage = useCallback(async (userMessage: string) => {
    let assistantIdx: number;
    setMessages((prev) => {
      assistantIdx = prev.length + 1;
      return [...prev, { role: "user", content: userMessage }, { role: "assistant" }];
    });
    setStreamingIndex(assistantIdx!);
    setIsLoading(true);
    setError(null);

    await streamChat(
      userMessage,
      sessionIdRef.current,
      (spec) => {
        setMessages((prev) =>
          prev.map((m, i) => (i === assistantIdx! ? { ...m, spec } : m))
        );
      },
      (finalSpec) => {
        setMessages((prev) =>
          prev.map((m, i) => (i === assistantIdx! ? { ...m, spec: finalSpec } : m))
        );
        setStreamingIndex(null);
        setIsLoading(false);
      },
      (errMsg) => {
        setMessages((prev) => prev.filter((_, i) => i !== assistantIdx!));
        setError(errMsg);
        setStreamingIndex(null);
        setIsLoading(false);
      }
    );

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      const userMessage = input.trim();
      setInput("");
      await sendMessage(userMessage);
    },
    [input, isLoading, sendMessage]
  );

  // #region genui - Action handlers passed to <ActionProvider />. When the user clicks a button in a rendered spec, json-render dispatches the bound action by calling the matching handler with its params. We intercept each action and synthesize a natural-language follow-up message so the conversation stays text-first and the model decides what to render next.
  const actionHandlers = {
    view_apartment: async (params: Record<string, unknown>) => {
      const id = String(params?.apartmentId ?? "");
      await sendMessage(`Show me details for apartment ${id}`);
    },
    schedule_tour: async (params: Record<string, unknown>) => {
      const id = String(params?.apartmentId ?? "");
      await sendMessage(`I'd like to schedule a tour for apartment ${id}`);
    },
    back_to_results: async () => {
      await sendMessage("Show me the previous search results again");
    },
    submit_tour: async (params: Record<string, unknown>) => {
      const id = String(params?.apartmentId ?? "");
      const form = document.querySelector(".tour-form");
      const inputs = form ? form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[name], textarea[name]") : [];
      const details = Array.from(inputs)
        .filter((el) => el.value && el.type !== "hidden")
        .map((el) => `${el.name}: ${el.value}`)
        .join(", ");
      const msg = details
        ? `Confirm my tour request for apartment ${id}. Here are my details: ${details}`
        : `Confirm my tour request for apartment ${id}`;
      await sendMessage(msg);
    },
  };
  // #endregion genui

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full items-center justify-center text-[var(--sea-ink-soft)]">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
              <p className="text-sm">
                Try: "Show me 2-bedroom apartments" or "What's available in
                Midtown?"
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isStreamingThis = i === streamingIndex;
          const hasSpec = msg.spec && msg.spec.root;

          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-[var(--lagoon)] px-4 py-3 text-white">
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="flex justify-start">
              <div className="island-shell max-w-[85%] rounded-2xl px-4 py-3">
                {hasSpec ? (
                  <StateProvider>
                    <VisibilityProvider>
                      <ActionProvider handlers={actionHandlers}>
                        <Renderer
                          spec={msg.spec!}
                          registry={registry}
                          loading={isStreamingThis}
                        />
                      </ActionProvider>
                    </VisibilityProvider>
                  </StateProvider>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:0ms]" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:150ms]" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:300ms]" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
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
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-[var(--lagoon)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--lagoon-deep)] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatInterface;
// #endregion genui
