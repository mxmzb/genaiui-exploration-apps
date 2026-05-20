import { createFileRoute } from "@tanstack/react-router";
import ChatInterface from "../components/ChatInterface";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col">
      <ChatInterface />
    </main>
  );
}
