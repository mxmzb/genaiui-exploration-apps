import { createFileRoute } from "@tanstack/react-router";
import { CanvasApp } from "../components/CanvasApp";

export const Route = createFileRoute("/canvas")({ component: CanvasPage });

function CanvasPage() {
  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl flex-col">
      <CanvasApp />
    </main>
  );
}
