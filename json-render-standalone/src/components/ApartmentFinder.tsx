// #region genui - json-render owns streaming and conversation state; the app chooses chat or a persistent surface.
import { useChatUI } from "@json-render/react";
import { useEffect, useRef } from "react";
import { SpecView } from "./SpecView";
import { Composer, Loading, Welcome, requestLabel } from "./FinderUI";

// The stream hook exposes an unparseable patch as text. Keep it out of the UI,
// but report the failure rather than repairing or completing the model's output.
const hasUnparsedPatch = (text: string) => /^\s*\{\s*"op"\s*:/m.test(text);

export function ApartmentFinder({ surface = false }: { surface?: boolean }) {
  const { messages, isStreaming, error, send, clear } = useChatUI({
    api: surface ? "/api/surface" : "/api/chat",
  });
  const lastUser = messages.findLast((m) => m.role === "user");
  const latest = messages.findLast((m) => m.spec?.root);
  const latestResponse = messages.at(-1);
  const invalidResponse =
    latestResponse?.role === "assistant" &&
    hasUnparsedPatch(latestResponse.text);
  const conversation = useRef<HTMLDivElement>(null);
  const active = messages.length > 0;
  useEffect(() => {
    if (!surface)
      conversation.current?.lastElementChild?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, [lastUser?.id, surface]);

  return (
    <main
      className={`finder ${active ? "has-messages" : ""} ${surface ? "surface-mode" : ""}`}
    >
      <Composer send={send} busy={isStreaming} />
      {active && (
        <div className="results-toolbar">
          <div>
            <p className="eyebrow">Your apartment search</p>
            <p className="search-summary">
              {requestLabel(lastUser?.text ?? "")}
            </p>
          </div>
          <button
            className="text-button"
            onClick={clear}
            disabled={isStreaming}
          >
            ↺ <span>Start fresh</span>
          </button>
        </div>
      )}
      <div className="finder-content" ref={conversation}>
        {!active ? (
          <Welcome send={send} />
        ) : surface ? (
          <div className="surface-results">
            {latestResponse?.text &&
              latestResponse.role === "assistant" &&
              !invalidResponse && (
                <p className="assistant-text">{latestResponse.text}</p>
              )}
            {isStreaming && <Loading />}
            {latest?.spec && (
              <SpecView
                key={latest.id}
                spec={latest.spec}
                busy={isStreaming || invalidResponse}
                send={send}
              />
            )}
          </div>
        ) : (
          messages.map((message) =>
            message.role === "user" ? (
              <div className="user-message" key={message.id}>
                <span>{requestLabel(message.text)}</span>
              </div>
            ) : (
              <section className="assistant-message" key={message.id}>
                <div className="assistant-label">
                  Next Place <span>YOUR HOME SEARCH COMPANION</span>
                </div>
                {message.text && !hasUnparsedPatch(message.text) && (
                  <p className="assistant-text">{message.text}</p>
                )}
                {message.spec?.root && (
                  <SpecView
                    spec={message.spec}
                    busy={isStreaming || hasUnparsedPatch(message.text)}
                    send={send}
                  />
                )}
                {isStreaming && message.id === latestResponse?.id && (
                  <Loading />
                )}
              </section>
            ),
          )
        )}
        {(error || (invalidResponse && !isStreaming)) && (
          <div className="error-notice" role="alert">
            <strong>We couldn’t finish that search.</strong>
            <p>
              {error?.message ??
                "The model returned an incomplete interface. Please try again."}
            </p>
            <button
              className="text-button"
              onClick={() => lastUser && send(lastUser.text)}
              disabled={isStreaming}
            >
              Try again ↗
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
// #endregion genui
