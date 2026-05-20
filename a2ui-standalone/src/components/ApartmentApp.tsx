import { useState, useCallback, useRef, useEffect } from "react";
import type { A2uiMessage } from "@a2ui/web_core/v0_9";
import { useA2uiProcessor, SurfaceRenderer } from "./A2uiRenderer";

// #region genui - Incremental SSE client: parses and processes each A2UI message as it streams
async function streamA2ui(
  message: string,
  sessionId: string,
  mode: "batch" | "progressive" | "per-field",
  onMessage: (message: A2uiMessage) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  const response = await fetch("/api/surface", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId, mode }),
  });

  if (!response.ok || !response.body) {
    onError(`Request failed: ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let depth = 0;
  let inString = false;
  let escape = false;
  let currentObj = "";
  let buffered: A2uiMessage | null = null;

  function emitMessage(msg: A2uiMessage) {
    const msgType = Object.keys(msg).find((k) => k !== "version") ?? "unknown";
    console.log(`[A2UI stream] ${msgType}`);

    if ("createSurface" in msg) {
      buffered = msg;
      return;
    }
    if (buffered) {
      onMessage(buffered);
      buffered = null;
    }
    onMessage(msg);
  }

  function processChunk(text: string) {
    for (const ch of text) {
      if (escape) {
        escape = false;
        if (depth > 0) currentObj += ch;
        continue;
      }
      if (ch === "\\" && inString) {
        escape = true;
        if (depth > 0) currentObj += ch;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        if (depth > 0) currentObj += ch;
        continue;
      }
      if (inString) {
        if (depth > 0) currentObj += ch;
        continue;
      }

      if (ch === "{") {
        depth++;
        currentObj += ch;
      } else if (ch === "}") {
        depth--;
        currentObj += ch;
        if (depth === 0 && currentObj) {
          try {
            emitMessage(JSON.parse(currentObj) as A2uiMessage);
          } catch {
            // malformed object — skip
          }
          currentObj = "";
        }
      } else if (depth > 0) {
        currentObj += ch;
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        onDone();
        return;
      }
      try {
        processChunk(JSON.parse(data) as string);
      } catch {
        // skip malformed SSE chunks
      }
    }
  }
}
// #endregion genui

interface LogEntry {
  type: "user" | "action" | "system";
  text: string;
}

export function ApartmentApp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [mode, setMode] = useState<"batch" | "progressive" | "per-field">(
    "progressive",
  );
  const sessionIdRef = useRef(crypto.randomUUID());
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const addLog = useCallback((entry: LogEntry) => {
    setLog((prev) => [...prev, entry]);
  }, []);

  // #region genui - Persistent A2UI processor: actions update the same surface in-place
  const sendMessage = useCallback(
    async (message: string, logEntry?: LogEntry) => {
      if (logEntry) addLog(logEntry);
      addLog({ type: "system", text: `Updating... (${mode})` });
      setIsLoading(true);
      setError(null);

      await streamA2ui(
        message,
        sessionIdRef.current,
        mode,
        (msg) => {
          processMessages([msg]);
        },
        () => {
          setLog((prev) => {
            const updated = prev.filter((e) => !e.text.startsWith("Updating..."));
            return [...updated, { type: "system" as const, text: "Surface updated" }];
          });
          setIsLoading(false);
        },
        (errMsg: string) => {
          setError(errMsg);
          setLog((prev) => prev.filter((e) => !e.text.startsWith("Updating...")));
          setIsLoading(false);
        }
      );
    },
    [addLog, mode]
  );

  const handleAction = useCallback(
    (action: { name: string; context: Record<string, string> }) => {
      const labels: Record<string, string> = {
        view_details: "View Details",
        schedule_tour: "Schedule Tour",
        back_to_results: "Back to Results",
        submit_tour: "Submit Tour Request",
      };

      const messages: Record<string, string> = {
        view_details: `Show details for apartment ${action.context?.apartmentId}`,
        schedule_tour: `Show tour form for apartment ${action.context?.apartmentId}`,
        back_to_results: "Go back to the apartment listing",
        submit_tour: `Confirm tour for apartment ${action.context?.apartmentId}`,
      };

      const label = labels[action.name] ?? action.name;
      const message = messages[action.name];

      if (message) {
        sendMessage(message, {
          type: "action",
          text: `Clicked: ${label}`,
        });
      } else {
        console.log("Unhandled action:", action.name);
      }
    },
    [sendMessage]
  );

  const { surfaces, processMessages } = useA2uiProcessor(handleAction);
  // #endregion genui

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      const message = input.trim();
      setInput("");
      sendMessage(message, { type: "user", text: message });
    },
    [input, isLoading, sendMessage]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Main content: surface + chat log side by side */}
      <div className="flex min-h-0 flex-1">
        {/* Surface panel */}
        <div className="flex-1 overflow-y-auto border-r border-[var(--line)] p-4">
          {surfaces.length === 0 && !isLoading && (
            <div className="flex h-full items-center justify-center text-[var(--sea-ink-soft)]">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
                <p className="text-sm">
                  Search for apartments by neighborhood, bedrooms, price, or
                  amenities.
                </p>
              </div>
            </div>
          )}

          <SurfaceRenderer surfaces={surfaces} />

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Chat log panel */}
        <div className="flex w-72 flex-col bg-[var(--foam)]">
          <div className="border-b border-[var(--line)] px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
              Activity
            </span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {log.length === 0 && (
              <p className="py-4 text-center text-xs text-[var(--sea-ink-soft)]">
                Your interactions will appear here
              </p>
            )}
            {log.map((entry, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-1.5 text-xs ${
                  entry.type === "user"
                    ? "bg-[var(--lagoon)]/10 text-[var(--lagoon-deep)]"
                    : entry.type === "action"
                      ? "bg-[var(--palm)]/10 text-[var(--palm)]"
                      : "text-[var(--sea-ink-soft)]"
                }`}
              >
                {entry.type === "user" && (
                  <span className="mr-1 font-semibold">You:</span>
                )}
                {entry.type === "action" && (
                  <span className="mr-1 font-semibold">&rarr;</span>
                )}
                {entry.text}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* Input bar at bottom */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[var(--line)] bg-[var(--surface-strong)] p-4"
      >
        <div className="flex gap-2">
          {/* Mode toggle */}
          <div className="flex items-center rounded-xl border border-[var(--line)] bg-white/50 text-xs">
            <button
              type="button"
              onClick={() => setMode("batch")}
              className={`rounded-l-xl px-3 py-2.5 font-medium transition ${
                mode === "batch"
                  ? "bg-[var(--lagoon)] text-white"
                  : "text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
              }`}
            >
              Batch
            </button>
            <button
              type="button"
              onClick={() => setMode("progressive")}
              className={`px-3 py-2.5 font-medium transition ${
                mode === "progressive"
                  ? "bg-[var(--lagoon)] text-white"
                  : "text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
              }`}
            >
              Progressive
            </button>
            <button
              type="button"
              onClick={() => setMode("per-field")}
              className={`rounded-r-xl px-3 py-2.5 font-medium transition ${
                mode === "per-field"
                  ? "bg-[var(--lagoon)] text-white"
                  : "text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
              }`}
            >
              Per-field
            </button>
          </div>
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

export default ApartmentApp;
