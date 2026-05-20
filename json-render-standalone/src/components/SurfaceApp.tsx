// #region genui - json-render surface mode UI. Maintains a single persistent surface spec that is replaced (not appended) on each agent response, with an activity log sidebar that records user prompts, action clicks, and system status. Streams JSONL spec patches from /api/surface, parses them with `parseSpecStreamLine`, and applies them with `applySpecPatch` to progressively rebuild the surface as it streams. Action bindings (view_apartment, schedule_tour, back_to_results, submit_tour) are intercepted via <ActionProvider /> and turned into synthesized follow-up user messages so the model decides what surface to render next.
import { useState, useRef, useCallback, useEffect, type FormEvent } from "react";
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

interface LogEntry {
  type: "user" | "action" | "system";
  text: string;
}

/**
 * Stream the surface response from /api/surface. Same JSONL-over-fetch shape as
 * the chat route — we use a manual fetch instead of `useUIStream` because that
 * hook posts a fixed `{ prompt, context, currentSpec }` body, while our surface
 * API expects `{ message, sessionId }` for server-side conversation history.
 */
async function streamSurface(
  userMessage: string,
  sessionId: string,
  onSpec: (spec: Spec) => void,
  onDone: (finalSpec: Spec) => void,
  onError: (error: string) => void
) {
  let response: Response;
  try {
    response = await fetch("/api/surface", {
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

const ACTION_LABELS: Record<string, string> = {
  view_apartment: "View Details",
  schedule_tour: "Schedule Tour",
  back_to_results: "Back to Results",
  submit_tour: "Submit Tour Request",
};

export function SurfaceApp() {
  const [surfaceSpec, setSurfaceSpec] = useState<Spec | null>(null);
  const [streamingSpec, setStreamingSpec] = useState<Spec | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  // Auto-scroll the activity log to the bottom on each new entry.
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const sendMessage = useCallback(async (userMessage: string) => {
    setLog((prev) => [
      ...prev,
      { type: "user", text: userMessage },
      { type: "system", text: "Updating..." },
    ]);
    setIsStreaming(true);
    setError(null);
    setStreamingSpec(null);

    await streamSurface(
      userMessage,
      sessionIdRef.current,
      (spec) => setStreamingSpec(spec),
      (finalSpec) => {
        setSurfaceSpec(finalSpec);
        setStreamingSpec(null);
        setIsStreaming(false);
        setLog((prev) => {
          // Replace the trailing "Updating..." entry with "Surface updated".
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].type === "system" && next[i].text === "Updating...") {
              next[i] = { type: "system", text: "Surface updated" };
              break;
            }
          }
          return next;
        });
      },
      (errMsg) => {
        setError(errMsg);
        setStreamingSpec(null);
        setIsStreaming(false);
        setLog((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].type === "system" && next[i].text === "Updating...") {
              next[i] = { type: "system", text: `Error: ${errMsg}` };
              break;
            }
          }
          return next;
        });
      }
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isStreaming) return;
      const userMessage = input.trim();
      setInput("");
      await sendMessage(userMessage);
    },
    [input, isStreaming, sendMessage]
  );

  // #region genui - Action handlers passed to <ActionProvider />. Each spec button click is intercepted and converted to a friendly activity-log entry plus a synthesized natural-language message so the surface re-renders against an updated server-side conversation history.
  const handleAction = useCallback(
    async (action: string, message: string) => {
      const label = ACTION_LABELS[action] ?? action;
      setLog((prev) => [...prev, { type: "action", text: `Clicked: ${label}` }]);
      await sendMessage(message);
    },
    [sendMessage]
  );

  const actionHandlers = {
    view_apartment: async (params: Record<string, unknown>) => {
      const id = String(params?.apartmentId ?? "");
      await handleAction("view_apartment", `Show me details for apartment ${id}`);
    },
    schedule_tour: async (params: Record<string, unknown>) => {
      const id = String(params?.apartmentId ?? "");
      await handleAction(
        "schedule_tour",
        `I'd like to schedule a tour for apartment ${id}`
      );
    },
    back_to_results: async () => {
      await handleAction(
        "back_to_results",
        "Show me the previous search results again"
      );
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
      await handleAction("submit_tour", msg);
    },
  };
  // #endregion genui

  const activeSpec = isStreaming && streamingSpec ? streamingSpec : surfaceSpec;
  const showLoadingDots =
    isStreaming && (!streamingSpec || !streamingSpec.root) && !surfaceSpec;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Surface panel */}
        <div className="flex-1 overflow-y-auto border-r border-[var(--line)] p-6">
          {!activeSpec && !showLoadingDots && (
            <div className="flex h-full items-center justify-center text-[var(--sea-ink-soft)]">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
                <p className="text-sm">
                  Search for apartments to populate this surface.
                </p>
              </div>
            </div>
          )}

          {showLoadingDots && (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:0ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:150ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {activeSpec && activeSpec.root && (
            <StateProvider>
              <VisibilityProvider>
                <ActionProvider handlers={actionHandlers}>
                  <Renderer
                    spec={activeSpec}
                    registry={registry}
                    loading={isStreaming}
                  />
                </ActionProvider>
              </VisibilityProvider>
            </StateProvider>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Activity log sidebar */}
        <aside className="flex w-72 flex-col bg-[var(--foam)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--sea-ink)]">
              Activity
            </h3>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {log.length === 0 && (
              <p className="px-1 text-xs text-[var(--sea-ink-soft)]">
                Your interactions will appear here
              </p>
            )}
            {log.map((entry, i) => {
              if (entry.type === "user") {
                return (
                  <div
                    key={i}
                    className="rounded-lg bg-[var(--lagoon)]/10 px-3 py-2 text-xs text-[var(--lagoon-deep)]"
                  >
                    <span className="font-semibold">You:</span> {entry.text}
                  </div>
                );
              }
              if (entry.type === "action") {
                return (
                  <div
                    key={i}
                    className="rounded-lg bg-[var(--palm)]/10 px-3 py-2 text-xs text-[var(--palm)]"
                  >
                    <span className="font-semibold">→</span> {entry.text}
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className="px-3 py-1 text-xs text-[var(--sea-ink-soft)]"
                >
                  {entry.text}
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </aside>
      </div>

      {/* Input bar */}
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
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="rounded-xl bg-[var(--lagoon)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--lagoon-deep)] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default SurfaceApp;
// #endregion genui
