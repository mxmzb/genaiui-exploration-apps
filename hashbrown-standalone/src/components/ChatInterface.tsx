import { createContext, useContext, useState, useRef, useEffect } from "react";
import { HashbrownProvider, useUiChat } from "@hashbrownai/react";
import { apartmentComponents } from "#/lib/components";
import {
  useSearchApartmentsTool,
  useGetApartmentDetailsTool,
  useApartmentJsTool,
} from "#/lib/tools";

type SendFn = (msg: { role: "user"; content: string }) => void;
export const ChatActionContext = createContext<SendFn | null>(null);
export function useChatAction() {
  const send = useContext(ChatActionContext);
  if (!send) throw new Error("useChatAction must be used inside ChatActionContext");
  return send;
}

function Chat() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
- For analytical questions (averages, comparisons, rankings), use the JavaScript tool to compute exact answers`,
    components: apartmentComponents,
    tools: [searchApartments, getApartmentDetails, apartmentJs],
  });

  const busy = isLoading || isReceiving;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    sendMessage({ role: "user", content: trimmed });
    setInput("");
  };

  return (
    <ChatActionContext value={sendMessage}>
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !busy && (
          <div className="flex h-full items-center justify-center text-[var(--sea-ink-soft)]">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
              <p className="text-sm">
                Try: &quot;Show me 2-bedroom apartments&quot; or &quot;What&apos;s
                available in Midtown?&quot;
              </p>
              <div className="mx-auto mt-4 max-w-sm rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-3">
                <p className="text-xs font-semibold text-[var(--lagoon-deep)]">WASM-powered analytics</p>
                <p className="mt-1 text-xs">
                  Ask analytical questions — the AI writes and executes JavaScript in a sandboxed runtime.
                </p>
                <p className="mt-2 text-xs italic">
                  &quot;What&apos;s the average rent?&quot; &middot; &quot;Which apartment has the best price per sqft?&quot; &middot; &quot;Compare pet-friendly vs no-pet rents&quot;
                </p>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-[var(--lagoon)] px-4 py-3 text-white">
                  <p className="text-sm">{String(msg.content)}</p>
                </div>
              </div>
            );
          }

          if (msg.role === "error") {
            return (
              <div key={i} className="flex justify-start">
                <div className="island-shell max-w-[85%] rounded-2xl px-4 py-3 text-sm text-red-600">
                  {msg.content}
                </div>
              </div>
            );
          }

          if (!msg.ui) return null;

          return (
            <div key={i} className="flex justify-start">
              <div className="island-shell max-w-[85%] rounded-2xl px-4 py-3">
                {msg.ui}
              </div>
            </div>
          );
        })}

        {busy && messages[messages.length - 1]?.role !== "assistant" && (
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

export function ChatInterface() {
  return (
    <HashbrownProvider url="/api/chat">
      <Chat />
    </HashbrownProvider>
  );
}
