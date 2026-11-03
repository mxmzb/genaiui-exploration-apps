import { useEffect, useState, type ReactNode } from "react";
import { CopilotKitProvider, useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import type { OpenUIError } from "@openuidev/react-lang";
import { Workspace } from "./Workspace";

// CopilotKit transports text. OpenUI owns parsing, rendering and its typed actions.
export function ApartmentFinder({ runtimeUrl = "/api/copilotkit", children, onDiagnostics }: {
  runtimeUrl?: string; children?: ReactNode; onDiagnostics?: (errors: OpenUIError[]) => void;
}) {
  const [session, setSession] = useState(0);
  return <CopilotKitProvider key={session} runtimeUrl={runtimeUrl} useSingleEndpoint={false} enableInspector={false}>
    <AgentWorkspace reset={() => setSession(s => s + 1)} onDiagnostics={onDiagnostics} />
    {children}
  </CopilotKitProvider>;
}
function AgentWorkspace({ reset, onDiagnostics }: { reset: () => void; onDiagnostics?: (errors: OpenUIError[]) => void }) {
  const { agent } = useAgent(), { copilotkit } = useCopilotKit();
  const [error, setError] = useState("");
  useEffect(() => {
    const subscription = agent.subscribe({ onRunInitialized: () => setError(""), onRunErrorEvent: ({event}) => setError(event.message), onRunFailed: ({error}) => setError(error.message) });
    return () => subscription.unsubscribe();
  }, [agent]);
  const index = agent.messages.findLastIndex(m => m.role === "user");
  const user = agent.messages[index];
  const assistant = agent.messages.slice(index + 1).findLast(m => m.role === "assistant" && typeof m.content === "string");
  async function send(text: string) {
    if (agent.isRunning) return;
    setError(""); agent.addMessage({ id: crypto.randomUUID(), role: "user", content: text });
    try { await copilotkit.runAgent({ agent }); } catch(e) { setError(String(e)); }
  }
  return <Workspace request={typeof user?.content === "string" ? user.content : ""} response={typeof assistant?.content === "string" ? assistant.content : null} busy={agent.isRunning} error={error} send={send} reset={reset} onDiagnostics={onDiagnostics} />;
}
