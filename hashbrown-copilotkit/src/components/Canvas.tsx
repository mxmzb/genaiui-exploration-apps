// #region genui - Persistent hashbrown canvas: renders latest assistant message as a surface
import { useMemo, useCallback } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useJsonParser } from "@hashbrownai/react";
import { useHashbrownKit } from "#/lib/chat-kit";
import { ChatActionContext } from "#/components/ChatView";

function getMessageText(m: { content?: unknown }): string {
  if (typeof m.content === "string") return m.content;
  return "";
}

function CanvasRenderer({ content }: { content: string }) {
  const kit = useHashbrownKit();
  const { value } = useJsonParser(content, kit.schema);
  if (!value) return null;
  return <div>{kit.render(value)}</div>;
}

export function Canvas() {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();

  const latestContent = useMemo(() => {
    if (!agent?.messages) return "";
    for (let i = agent.messages.length - 1; i >= 0; i--) {
      const msg = agent.messages[i];
      const text = getMessageText(msg);
      if (msg.role === "assistant" && text.trimStart().startsWith("{")) {
        return text;
      }
    }
    return "";
  }, [agent?.messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      agent.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      });
      await copilotkit.runAgent({ agent });
    },
    [agent, copilotkit],
  );

  return (
    <ChatActionContext value={sendMessage}>
      <div className="flex h-full flex-col overflow-y-auto p-6">
        {latestContent ? (
          <CanvasRenderer content={latestContent} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-[var(--sea-ink-soft)]">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold">Apartment Finder</h2>
              <p className="text-sm">
                Search for apartments by neighborhood, bedrooms, price, or amenities.
              </p>
            </div>
          </div>
        )}
      </div>
    </ChatActionContext>
  );
}
// #endregion genui
