import { type ReactNode, useState, useRef, useEffect } from "react";
import { HashbrownProvider, useUiChat } from "@hashbrownai/react";
import { apartmentComponents } from "#/lib/components";
import { ChatActionContext } from "#/components/ChatInterface";
import {
  useSearchApartmentsTool,
  useGetApartmentDetailsTool,
  useApartmentJsTool,
} from "#/lib/tools";

interface LogEntry {
  type: "user" | "action" | "system";
  text: string;
}

function Canvas() {
  const [input, setInput] = useState("");
  const [currentView, setCurrentView] = useState<ReactNode>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const prevBusy = useRef(false);

  const searchApartments = useSearchApartmentsTool();
  const getApartmentDetails = useGetApartmentDetailsTool();
  const apartmentJs = useApartmentJsTool();

  const { messages, sendMessage, isLoading, isReceiving } = useUiChat({
    model: "gpt-4.1",
    system: `You are an apartment finder assistant. Help users find and explore apartments.

# Capabilities
- Use the searchApartments tool to find apartments matching criteria
- Use the getApartmentDetails tool to get full information about a specific apartment
- Use the JavaScript tool to compute insights, aggregations, comparisons, or any custom analysis over the apartment data (e.g. average rent, price per sqft, neighborhood comparisons)
- Render results using the UI components available to you

# Rules
- When showing search results, always use ApartmentList with ApartmentCard children
- When showing a single apartment's details, use DetailView
- When the user wants to schedule a tour, use TourForm
- After a tour is "scheduled", use Confirmation
- For general text responses, use Markdown
- Always call tools to get data — do not make up apartment details
- For analytical questions (averages, comparisons, rankings), use the JavaScript tool to compute exact answers
- Your response REPLACES the previous view entirely. Always render a complete, self-contained UI.
- Never reference previous messages or "what I showed you before"`,
    components: apartmentComponents,
    tools: [searchApartments, getApartmentDetails, apartmentJs],
  });

  const busy = isLoading || isReceiving;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  useEffect(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant" && m.ui);
    if (last && last.role === "assistant") {
      setCurrentView(last.ui);
    }
  }, [messages]);

  useEffect(() => {
    if (prevBusy.current && !busy) {
      setLog((prev) => {
        const updated = prev.filter((e) => e.text !== "Updating...");
        return [...updated, { type: "system", text: "Surface updated" }];
      });
    }
    prevBusy.current = busy;
  }, [busy]);

  const addLog = (entry: LogEntry) => setLog((prev) => [...prev, entry]);

  const handleSend = (message: string, logEntry?: LogEntry) => {
    if (logEntry) addLog(logEntry);
    addLog({ type: "system", text: "Updating..." });
    sendMessage({ role: "user", content: message });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setInput("");
    handleSend(trimmed, { type: "user", text: trimmed });
  };

  return (
    <ChatActionContext value={(msg) => {
      handleSend(msg.content, { type: "action", text: "Clicked action" });
    }}>
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Surface panel */}
        <div className="flex-1 overflow-y-auto border-r border-[var(--line)] p-4">
          {!currentView && !busy && (
            <div className="flex h-full items-center justify-center text-[var(--sea-ink-soft)]">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
                <p className="text-sm">
                  Search for apartments by neighborhood, bedrooms, price, or amenities.
                </p>
                <div className="mx-auto mt-4 max-w-sm rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-3 text-left">
                  <p className="text-xs font-semibold text-[var(--lagoon-deep)]">WASM-powered analytics</p>
                  <p className="mt-1 text-xs">
                    Ask analytical questions — the AI writes and executes JavaScript in a sandboxed runtime.
                  </p>
                  <p className="mt-2 text-xs italic">
                    &quot;What&apos;s the average rent?&quot; &middot; &quot;Best price per sqft?&quot; &middot; &quot;Compare pet-friendly vs no-pet rents&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          {!currentView && busy && (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:0ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:150ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--lagoon)] [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {currentView && currentView}
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
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
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

export function CanvasApp() {
  return (
    <HashbrownProvider url="/api/chat">
      <Canvas />
    </HashbrownProvider>
  );
}
