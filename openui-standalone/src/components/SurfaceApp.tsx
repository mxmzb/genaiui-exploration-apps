import { useState, useCallback, useRef, useEffect } from "react";
import { Renderer, type ParseResult } from "@openuidev/react-lang";
import "@openuidev/react-ui/components.css";
import { apartmentLibrary } from "../lib/apartment-library";
import { toolProvider } from "../lib/tool-provider";
import { sanitizeOpenUIOutput } from "../lib/openui-sanitizer";

async function streamChat(
  userMessage: string,
  sessionId: string,
  onChunk: (accumulated: string) => void,
  onDone: (fullResponse: string) => void,
  onError: (error: string) => void
) {
  const response = await fetch("/api/surface", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage, sessionId }),
  });

  if (!response.ok || !response.body) {
    onError(`Request failed: ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          onDone(accumulated);
          return;
        }
        try {
          const textChunk = JSON.parse(data) as string;
          accumulated += textChunk;
          onChunk(accumulated);
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}

const SUGGESTIONS = [
  "Show me apartments",
  "Show me 2-bedroom apartments",
  "What's available in Arts District?",
  "Show me apartments under $2,500",
  "Show me an apartment dashboard",
];

interface LogEntry {
  type: "user" | "action" | "system";
  text: string;
}

export function SurfaceApp() {
  const handleParseResult = useCallback((result: ParseResult | null) => {
    if (result?.meta.errors.length) {
      console.warn("[openui] validation errors:", result.meta.errors);
    }
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [surfaceContent, setSurfaceContent] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const sessionIdRef = useRef(crypto.randomUUID());
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const addLog = useCallback((entry: LogEntry) => {
    setLog((prev) => [...prev, entry]);
  }, []);

  const sendMessage = useCallback(
    async (message: string, logEntry?: LogEntry) => {
      if (logEntry) addLog(logEntry);
      addLog({ type: "system", text: "Updating..." });
      setIsLoading(true);
      setError(null);
      setStreamingContent("");

      await streamChat(
        message,
        sessionIdRef.current,
        (accumulated) => setStreamingContent(accumulated),
        (fullResponse) => {
          setSurfaceContent(fullResponse);
          setStreamingContent("");
          setLog((prev) => {
            const updated = prev.filter((e) => !e.text.startsWith("Updating..."));
            return [...updated, { type: "system" as const, text: "Surface updated" }];
          });
          setIsLoading(false);
        },
        (errMsg: string) => {
          setError(errMsg);
          setStreamingContent("");
          setLog((prev) => prev.filter((e) => !e.text.startsWith("Updating...")));
          setIsLoading(false);
        }
      );
    },
    [addLog]
  );

  const handleAction = useCallback(
    (action: unknown) => {
      const event = action as { type?: string; humanFriendlyMessage?: string; formState?: Record<string, unknown> };
      const actionStr = event.humanFriendlyMessage ?? "";

      const parts = actionStr.split(":");
      const [prefix, verb, id] = parts;

      const labels: Record<string, string> = {
        view: "View Details",
        tour: "Schedule Tour",
        back: "Back to Results",
      };

      if (prefix === "action") {
        const label = labels[verb] ?? verb;
        switch (verb) {
          case "view":
            sendMessage(`Show me details for apartment ${id}`, {
              type: "action",
              text: `Clicked: ${label}`,
            });
            break;
          case "tour":
            sendMessage(`I'd like to schedule a tour for apartment ${id}`, {
              type: "action",
              text: `Clicked: ${label}`,
            });
            break;
          case "back":
            sendMessage("Go back and show me the apartment listings again", {
              type: "action",
              text: `Clicked: ${label}`,
            });
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
        sendMessage(msg, {
          type: "action",
          text: "Clicked: Submit Tour Request",
        });
      } else {
        console.log("Unhandled action:", actionStr);
      }
    },
    [sendMessage]
  );

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

  const displayContent = isLoading && streamingContent ? streamingContent : surfaceContent;
  const isStreaming = isLoading && !!streamingContent;

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Surface panel */}
        <div className="flex-1 overflow-y-auto border-r border-[var(--line)] p-4">
          {!displayContent && !isLoading && (
            <div className="flex h-full items-center justify-center text-[var(--sea-ink-soft)]">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
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
              </div>
            </div>
          )}

          {!displayContent && isLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:0ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:150ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {displayContent && (
            <div className={isStreaming ? "openui-streaming" : undefined}>
              <Renderer
                library={apartmentLibrary}
                response={sanitizeOpenUIOutput(displayContent)}
                isStreaming={isStreaming}
                onAction={handleAction}
                toolProvider={toolProvider}
                onParseResult={handleParseResult}
              />
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Activity log panel */}
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

export default SurfaceApp;
