import { useState, useRef, useCallback } from "react";
import { Renderer, type ParseResult } from "@openuidev/react-lang";
import "@openuidev/react-ui/components.css";
import { apartmentLibrary } from "../lib/apartment-library";
import { toolProvider } from "../lib/tool-provider";
import { sanitizeOpenUIOutput } from "../lib/openui-sanitizer";

const SUGGESTIONS = [
  "Show me apartments",
  "Show me 2-bedroom apartments",
  "What's available in Midtown?",
  "Show me apartments under $3,000",
  "Show me an apartment dashboard",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function streamChat(
  userMessage: string,
  sessionId: string,
  onChunk: (accumulated: string) => void,
  onDone: (fullResponse: string) => void,
  onError: (error: string) => void
) {
  const response = await fetch("/api/chat", {
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

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  const handleParseResult = useCallback((result: ParseResult | null) => {
    if (result?.meta.errors.length) {
      console.warn("[openui] validation errors:", result.meta.errors);
    }
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setError(null);
    setStreamingResponse("");

    await streamChat(
      userMessage,
      sessionIdRef.current,
      (accumulated) => setStreamingResponse(accumulated),
      (fullResponse) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullResponse },
        ]);
        setStreamingResponse("");
        setIsLoading(false);
      },
      (errMsg) => {
        setError(errMsg);
        setStreamingResponse("");
        setIsLoading(false);
      }
    );

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage = input.trim();
      setInput("");
      await sendMessage(userMessage);
    },
    [input, isLoading, sendMessage]
  );

  const handleAction = useCallback(
    (action: unknown) => {
      const event = action as { type?: string; humanFriendlyMessage?: string; formState?: Record<string, unknown> };
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
            sendMessage("Go back and show me the apartment listings again");
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
      } else {
        console.log("Unhandled action:", actionStr);
      }
    },
    [sendMessage]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading && (
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

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl bg-[var(--lagoon)] px-4 py-3 text-white">
                <p className="text-sm">{msg.content}</p>
              </div>
            ) : (
              <div className="w-full">
                <Renderer
                  library={apartmentLibrary}
                  response={sanitizeOpenUIOutput(msg.content)}
                  isStreaming={false}
                  onAction={handleAction}
                  toolProvider={toolProvider}
                  onParseResult={handleParseResult}
                />
              </div>
            )}
          </div>
        ))}

        {/* Progressive rendering during streaming */}
        {isLoading && streamingResponse && (
          <div className="flex w-full justify-start">
            <div className="openui-streaming w-full">
              <Renderer
                library={apartmentLibrary}
                response={sanitizeOpenUIOutput(streamingResponse)}
                isStreaming={true}
                onAction={handleAction}
                toolProvider={toolProvider}
                onParseResult={handleParseResult}
              />
            </div>
          </div>
        )}

        {/* Loading dots before content starts streaming */}
        {isLoading && !streamingResponse && (
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
