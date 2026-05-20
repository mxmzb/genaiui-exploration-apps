import { s } from "@hashbrownai/core";
import { useTool, useRuntimeFunction, useRuntime } from "@hashbrownai/react";
import { useMemo } from "react";
import { loadApartments } from "#/lib/apartment-data";

export function useSearchApartmentsTool() {
  return useTool({
    name: "searchApartments",
    description:
      "Search available apartments by filters. Returns matching apartment summaries. Call with no filters to list all apartments.",
    schema: s.object("Search filters", {
      bedrooms: s.number("Exact number of bedrooms to match (0 for studio)"),
      maxRent: s.number("Maximum monthly rent in dollars"),
      neighborhood: s.string("Neighborhood name to filter by (case-insensitive partial match)"),
    }),
    handler: async (input) => {
      let results = [...(await loadApartments())];

      if (input.bedrooms !== undefined) {
        results = results.filter((a) => a.bedrooms === input.bedrooms);
      }
      if (input.maxRent !== undefined && input.maxRent > 0) {
        results = results.filter((a) => a.rent <= input.maxRent);
      }
      if (input.neighborhood) {
        const q = input.neighborhood.toLowerCase();
        results = results.filter((a) =>
          a.neighborhood.toLowerCase().includes(q)
        );
      }

      return results.map((a) => ({
        id: a.id,
        title: a.title,
        neighborhood: a.neighborhood,
        rent: a.rent,
        bedrooms: a.bedrooms === 0 ? "Studio" : `${a.bedrooms} bed`,
        sqft: a.sqft,
        imageUrl: a.imageUrl,
      }));
    },
    deps: [],
  });
}

export function useGetApartmentDetailsTool() {
  return useTool({
    name: "getApartmentDetails",
    description: "Get full details for a specific apartment by ID",
    schema: s.object("Apartment lookup", {
      id: s.string("The apartment ID"),
    }),
    handler: async (input) => {
      const apartments = await loadApartments();
      const apt = apartments.find((a) => a.id === input.id);
      if (!apt) return { error: "Apartment not found" };

      return {
        ...apt,
        bedrooms: apt.bedrooms === 0 ? "Studio" : `${apt.bedrooms} bed`,
        nearbyTransit: apt.nearbyTransit.map((t) => {
          const match = t.match(/^(.+?)\s*-\s*(.+)$/);
          return match
            ? { type: "transit", name: match[1], distance: match[2] }
            : { type: "transit", name: t, distance: "" };
        }),
      };
    },
    deps: [],
  });
}

export function useApartmentJsTool() {
  const getApartments = useRuntimeFunction({
    name: "getApartments",
    description: "Returns all apartments with full details",
    result: s.array(
      "All apartments",
      s.object("An apartment", {
        id: s.string("Apartment ID"),
        title: s.string("Title"),
        neighborhood: s.string("Neighborhood"),
        rent: s.number("Monthly rent"),
        bedrooms: s.number("Number of bedrooms (0 = studio)"),
        bathrooms: s.number("Number of bathrooms"),
        sqft: s.number("Square footage"),
        petPolicy: s.string("Pet policy"),
        amenities: s.array("Amenities", s.string("An amenity")),
      })
    ),
    handler: async () => {
      const apartments = await loadApartments();
      return apartments.map((a) => ({
        id: a.id,
        title: a.title,
        neighborhood: a.neighborhood,
        rent: a.rent,
        bedrooms: a.bedrooms,
        bathrooms: a.bathrooms,
        sqft: a.sqft,
        petPolicy: a.petPolicy,
        amenities: a.amenities,
      }));
    },
    deps: [],
  });

  const runtime = useRuntime({
    timeout: 10000,
    functions: useMemo(() => [getApartments], [getApartments]),
  });

  return useTool({
    name: "runJavaScript",
    description: [
      "Execute JavaScript code to analyze apartment data.",
      "The code runs in a sandboxed environment with no internet or DOM access.",
      "IMPORTANT: The code is evaluated as a script, NOT a function body. Do NOT use `return`. The result is the value of the last expression.",
      "Example: `var apts = getApartments(); apts.reduce((s, a) => s + a.rent, 0) / apts.length;`",
      "",
      "Available functions:",
      runtime.describe(),
    ].join("\n"),
    schema: s.object("JS execution request", {
      code: s.string("The JavaScript code to run"),
    }),
    handler: async (input, abortSignal) => {
      console.log("[WASM] Executing code:", input.code);
      try {
        const result = await runtime.run(input.code, abortSignal);
        console.log("[WASM] Result:", result);
        return result;
      } catch (err) {
        console.error("[WASM] Error:", err);
        throw err;
      }
    },
    deps: [runtime],
  });
}
