import { useState } from "react";
import { ChatProvider, fetchLLM, openAIAdapter, openAIMessageFormat, useThread } from "@openuidev/react-headless";
import { Workspace } from "../../../openui-copilotkit/src/components/Workspace";
const llm = fetchLLM({ url: "/api/chat", streamAdapter: openAIAdapter(), messageFormat: openAIMessageFormat });
export function ApartmentFinder() {
  const [session, setSession] = useState(0);
  return <ChatProvider key={session} llm={llm}><ChatWorkspace reset={() => setSession(s => s + 1)} /></ChatProvider>;
}
function ChatWorkspace({ reset }: { reset: () => void }) {
  const { messages, isRunning, threadError, processMessage } = useThread();
  const index = messages.findLastIndex(m => m.role === "user");
  const user = messages[index];
  const assistant = messages.slice(index + 1).findLast(m => m.role === "assistant");
  const request = user?.role === "user" ? (typeof user.content === "string" ? user.content : user.content.filter(c => c.type === "text").map(c => c.text).join("\n")) : "";
  return <Workspace request={request} response={assistant?.role === "assistant" ? assistant.content ?? null : null} busy={isRunning} error={threadError ? String(threadError) : ""} send={text => processMessage({ role: "user", content: [{ type: "text", text }] })} reset={reset} />;
}
