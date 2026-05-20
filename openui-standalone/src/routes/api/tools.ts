import { createFileRoute } from "@tanstack/react-router";
import { executeGetApartments, executeGetNeighborhoods, executeSubmitTour } from "../../lib/apartment-tools";

export const Route = createFileRoute("/api/tools")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { tool, args } = (await request.json()) as {
          tool: string;
          args: Record<string, unknown>;
        };

        console.log(`[tools] ${tool}(${JSON.stringify(args)})`);
        let result: unknown;

        switch (tool) {
          case "get_neighborhoods":
            result = executeGetNeighborhoods();
            break;
          case "get_apartments":
            result = executeGetApartments(args);
            break;
          case "submit_tour":
            result = executeSubmitTour(args);
            break;
          default:
            return new Response(
              JSON.stringify({ error: `Unknown tool: ${tool}` }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
        }

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
