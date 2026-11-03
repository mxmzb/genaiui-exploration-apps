import { useState } from "react";
import { HashbrownProvider, useUiChat } from "@hashbrownai/react";
import { apartmentComponents } from "../../../hashbrown-copilotkit/src/lib/components";
import { compositionRules } from "../../../hashbrown-copilotkit/src/lib/ui-instructions";
import { Workspace } from "../../../hashbrown-copilotkit/src/components/Workspace";
export function ApartmentFinder() {
  const [session, setSession] = useState(0);
  return <HashbrownProvider key={session} url="/api/chat"><Chat reset={() => setSession(s => s + 1)} /></HashbrownProvider>;
}
function Chat({ reset }: { reset: () => void }) {
  const { messages, sendMessage, isLoading, isReceiving } = useUiChat({ system: compositionRules, components: apartmentComponents });
  const index = messages.findLastIndex(m => m.role === "user");
  const user = messages[index];
  const assistant = messages.slice(index + 1).findLast(m => m.role === "assistant");
  const failure = messages.slice(index + 1).findLast(m => m.role === "error");
  return <Workspace request={user?.role === "user" ? String(user.content) : ""} rendered={assistant?.role === "assistant" ? assistant.ui : null} busy={isLoading || isReceiving} error={failure?.role === "error" ? String(failure.content) : ""} send={async content => { sendMessage({ role: "user", content }); }} reset={reset} />;
}
