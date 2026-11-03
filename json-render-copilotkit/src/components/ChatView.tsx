// #region genui - CopilotKit owns the agent conversation; json-render turns its JSONL tool results into React.
import { useMemo, useState } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { parseSpec } from "../lib/parse-spec";
import { SpecView } from "./SpecView";
import { Composer, Loading, Welcome, requestLabel } from "./FinderUI";

export function ChatView({ canvasMode = false }: { canvasMode?: boolean }) {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();
  const [error, setError] = useState("");
  const messages = useMemo(() => {
    const visible = agent.messages.flatMap((m) => {
      const text = typeof m.content === "string" ? m.content : "";
      if (!text || !["user", "assistant", "tool"].includes(m.role)) return [];
      // Repair only completed runs; an in-flight patch may still lack its path/value.
      const spec = m.role === "user" ? null : parseSpec(text, !agent.isRunning);
      if (m.role === "tool" && !spec) return [];
      return [{ id: m.id, role: m.role, text: spec ? "" : text, spec }];
    });
    // Keep one rendering when a transport surfaces the same tool output twice.
    return visible.filter((message, index) => {
      if (!message.spec) return true;
      for (const later of visible.slice(index + 1)) {
        if (later.role === "user") break;
        if (later.spec) return false;
      }
      return true;
    });
  }, [agent.messages, agent.isRunning]);
  const lastUser = messages.findLast((m) => m.role === "user");
  const latest = messages.findLast((m) => m.spec);

  async function send(text: string) {
    if (agent.isRunning) return;
    setError("");
    agent.addMessage({ id: crypto.randomUUID(), role: "user", content: text });
    try {
      await copilotkit.runAgent({ agent });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The agent is unavailable. Please try again.",
      );
    }
  }
  function clear() {
    agent.setMessages([]);
    agent.setState({});
    agent.threadId = crypto.randomUUID();
    setError("");
  }

  return (
    <main className={`finder ${messages.length ? "has-messages" : ""}`}>
      <Composer send={send} busy={agent.isRunning} />
      {messages.length > 0 && (
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
            disabled={agent.isRunning}
          >
            ↺ Start fresh
          </button>
        </div>
      )}
      <div className="finder-content">
        {!messages.length ? (
          <Welcome send={send} busy={agent.isRunning} />
        ) : canvasMode ? (
          <>
            {messages.findLast((m) => m.role === "assistant" && m.text)
              ?.text && (
              <p className="assistant-text">
                {
                  messages.findLast((m) => m.role === "assistant" && m.text)
                    ?.text
                }
              </p>
            )}
            {latest?.spec && (
              <SpecView
                key={latest.id}
                spec={latest.spec}
                busy={agent.isRunning}
                send={send}
              />
            )}
          </>
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <div className="user-message" key={m.id}>
                <span>{requestLabel(m.text)}</span>
              </div>
            ) : (
              <section className="assistant-message" key={m.id}>
                <div className="assistant-label">
                  Next Place <span>YOUR HOME SEARCH COMPANION</span>
                </div>
                {m.text && <p className="assistant-text">{m.text}</p>}
                {m.spec && (
                  <SpecView spec={m.spec} busy={agent.isRunning} send={send} />
                )}
              </section>
            ),
          )
        )}
        {agent.isRunning && <Loading />}
        {error && (
          <div className="error-notice" role="alert">
            <strong>We couldn’t finish that search.</strong>
            <p>{error}</p>
            <button
              className="text-button"
              onClick={() => lastUser && send(lastUser.text)}
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
