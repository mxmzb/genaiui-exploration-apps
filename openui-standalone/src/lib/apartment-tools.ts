import type { Apartment } from "./apartment-data";
import { apartments } from "./apartment-data";

export const TOOL_SPECS = [
  {
    name: "get_neighborhoods",
    description:
      "Returns the list of distinct neighborhood names available in the database. Use this to populate filter dropdowns.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "array",
      items: { type: "string" },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_apartments",
    description:
      "Search apartments with optional filters. Returns an array of matching apartments. Call with no filters to get all apartments.",
    inputSchema: {
      type: "object",
      properties: {
        neighborhood: {
          type: "string",
          description: "Filter by neighborhood name (exact match). Ignored if 'all'.",
        },
        bedrooms: {
          type: "string",
          description: "Exact number of bedrooms (0 for studio). Ignored if 'any'.",
        },
        max_rent: {
          type: "string",
          description: "Maximum monthly rent in dollars. Ignored if 'any'.",
        },
      },
    },
    outputSchema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          neighborhood: { type: "string" },
          rent: { type: "number" },
          bedrooms: { type: "number" },
          bathrooms: { type: "number" },
          sqft: { type: "number" },
          description: { type: "string" },
          imageUrl: { type: "string" },
          petPolicy: { type: "string" },
          amenities: { type: "array", items: { type: "string" } },
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "submit_tour",
    description:
      "Submit a tour request for an apartment. Returns a confirmation with a reference number.",
    inputSchema: {
      type: "object",
      properties: {
        apartment_id: { type: "string", description: "The apartment ID" },
        name: { type: "string", description: "Visitor's full name" },
        email: { type: "string", description: "Visitor's email address" },
        date: { type: "string", description: "Preferred tour date" },
        message: { type: "string", description: "Optional message" },
      },
      required: ["apartment_id", "name", "email"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        reference: { type: "string" },
        message: { type: "string" },
      },
    },
    annotations: { destructiveHint: false },
  },
];

const SKIP_VALUES = new Set(["all", "any", "", "null", "undefined"]);

function isReal(v: unknown): v is string | number {
  if (v == null) return false;
  if (typeof v === "string" && SKIP_VALUES.has(v.toLowerCase())) return false;
  return true;
}

export function executeGetNeighborhoods(): string[] {
  return [...new Set(apartments.map((a) => a.neighborhood))].sort();
}

export function executeGetApartments(args: Record<string, unknown>): Apartment[] {
  let results = [...apartments];

  if (isReal(args.neighborhood)) {
    results = results.filter(
      (a) => a.neighborhood.toLowerCase() === String(args.neighborhood).toLowerCase(),
    );
  }
  if (isReal(args.bedrooms)) {
    const bed = Number(args.bedrooms);
    if (!isNaN(bed)) results = results.filter((a) => a.bedrooms === bed);
  }
  if (isReal(args.max_rent)) {
    const max = Number(args.max_rent);
    if (!isNaN(max)) results = results.filter((a) => a.rent <= max);
  }

  return results;
}

export function executeSubmitTour(args: Record<string, unknown>) {
  const ref = `TOUR-${Date.now().toString(36).toUpperCase()}`;
  return {
    success: true,
    reference: ref,
    message: `Tour request ${ref} confirmed for apartment ${args.apartment_id}. We'll contact ${args.name} at ${args.email} to finalize the date.`,
  };
}
