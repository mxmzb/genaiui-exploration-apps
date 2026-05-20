import { useState, useRef, useCallback } from "react";
import type { A2uiMessage } from "@a2ui/web_core/v0_9";
import { A2uiRenderer } from "./A2uiRenderer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  a2uiMessages?: A2uiMessage[];
}

// #region genui - Streaming SSE client that accumulates A2UI JSON from the LLM response
async function streamChat(
  userMessage: string,
  onA2uiMessages: (messages: A2uiMessage[]) => void,
  onError: (error: string) => void
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage }),
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
          // Parse the full accumulated JSON
          try {
            // Strip markdown code fences if the LLM wrapped the JSON
            let cleaned = accumulated.trim();
            if (cleaned.startsWith("```")) {
              cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
            }
            const parsed = JSON.parse(cleaned) as A2uiMessage[];
            onA2uiMessages(parsed);
          } catch (e) {
            console.error("Failed to parse A2UI response:", e, accumulated);
            onError("Failed to parse AI response as A2UI JSON");
          }
          return;
        }
        // Each SSE data event contains a JSON-encoded string chunk from the LLM
        try {
          const textChunk = JSON.parse(data) as string;
          accumulated += textChunk;
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}
// #endregion genui

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage = input.trim();
      setInput("");
      setError(null);

      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setIsLoading(true);

      await streamChat(
        userMessage,
        (a2uiMessages) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "", a2uiMessages: a2uiMessages },
          ]);
          setIsLoading(false);
        },
        (errMsg) => {
          setError(errMsg);
          setIsLoading(false);
        }
      );

      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    [input, isLoading]
  );

  // #region genui - Action handler: translates A2UI button events into follow-up LLM requests
  const sendFollowUp = useCallback(
    async (userMessage: string) => {
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setIsLoading(true);
      setError(null);

      await streamChat(
        userMessage,
        (a2uiMessages) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "", a2uiMessages },
          ]);
          setIsLoading(false);
        },
        (errMsg) => {
          setError(errMsg);
          setIsLoading(false);
        }
      );

      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    []
  );

  const handleAction = useCallback(
    (action: unknown) => {
      const { name, context } = action as { name: string; context: Record<string, string> };

      switch (name) {
        case "view_details":
          sendFollowUp(`Show me details for apartment ${context?.apartmentId}`);
          break;
        case "schedule_tour":
          sendFollowUp(`I'd like to schedule a tour for apartment ${context?.apartmentId}`);
          break;
        case "back_to_results":
          sendFollowUp("Show me the previous search results again");
          break;
        case "submit_tour":
          sendFollowUp(`Confirm my tour request for apartment ${context?.apartmentId}`);
          break;
        default:
          console.log("Unhandled A2UI action:", name, context);
      }
    },
    [sendFollowUp]
  );
  // #endregion genui

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
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

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[var(--lagoon)] text-white"
                  : "island-shell"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-sm">{msg.content}</p>
              ) : msg.a2uiMessages ? (
                <A2uiRenderer
                  messages={msg.a2uiMessages}
                  onAction={handleAction}
                />
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
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
