import { createFileRoute } from "@tanstack/react-router";
import { getAllApartments } from "../../../../db/query";

export const Route = createFileRoute("/api/apartments")({
  server: {
    handlers: {
      GET: async () => {
        const apartments = getAllApartments();
        return new Response(JSON.stringify(apartments), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
