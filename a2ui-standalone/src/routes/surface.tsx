import { createFileRoute } from "@tanstack/react-router";
import ApartmentApp from "../components/ApartmentApp";

export const Route = createFileRoute("/surface")({ component: SurfacePage });

function SurfacePage() {
  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl flex-col">
      <ApartmentApp />
    </main>
  );
}
