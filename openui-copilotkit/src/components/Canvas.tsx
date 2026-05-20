// #region genui - Persistent OpenUI canvas: extracts latest assistant message, renders as surface
import { useCallback, useMemo } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { Renderer } from "@openuidev/react-lang";
import "@openuidev/react-ui/components.css";
import { isOpenUILang } from "./ChatView";
import { apartmentLibrary } from "../lib/apartment-library";
import { toolProvider } from "../lib/tool-provider";
import { sanitizeOpenUIOutput } from "../lib/openui-sanitizer";

export function Canvas() {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();

  const latestContent = useMemo(() => {
    if (!agent?.messages) return "";
    for (let i = agent.messages.length - 1; i >= 0; i--) {
      const msg = agent.messages[i];
      const text = typeof msg.content === "string" ? msg.content : "";
      if ((msg.role === "assistant" || msg.role === "tool") && isOpenUILang(text)) {
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
        sendMessage(
          formSummary
            ? `Confirm my tour request for apartment ${apartmentId}. Details: ${formSummary}`
            : `Confirm my tour request for apartment ${apartmentId}`,
        );
      }
    },
    [sendMessage],
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      {latestContent ? (
        <Renderer
          library={apartmentLibrary}
          response={sanitizeOpenUIOutput(latestContent)}
          isStreaming={agent.isRunning}
          onAction={handleAction}
          toolProvider={toolProvider}
        />
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
  );
}
// #endregion genui
