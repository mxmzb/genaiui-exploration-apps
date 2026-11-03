// #region genui - A persistent canvas uses the same agent conversation and only shows the latest generated view.
import { ChatView } from "./ChatView";
export function Canvas() {
  return <ChatView canvasMode />;
}
// #endregion genui
