// #region genui - A2UI catalog definitions: Zod schemas defining the component contract between agent and frontend
import { z } from "zod";

export const apartmentCatalogDefinitions = {
  // Row, Column, Text, Image, Button, TextField, DateTimeInput come from the
  // basic catalog (includeBasicCatalog: true). Form inputs there keep
  // path-bindable values (DynString) for two-way binding. Our custom
  // display components below are literal-only by design — narrowing forces
  // the LLM to emit separate components with inline values rather than the
  // template + path-bound data pattern.

  Title: {
    description: "A heading. Use for page titles and section headings.",
    props: z.object({
      text: z.string(),
      level: z.enum(["h1", "h2", "h3"]).optional(),
    }),
  },
  ApartmentCard: {
    description:
      "A card displaying an apartment listing. Compose by referencing other " +
      "components by ID via the slot props — each slot points to a separate " +
      "top-level component definition. apartmentId is REQUIRED — the card " +
      "renders two standard action buttons (View Details, Schedule Tour) " +
      "automatically and binds them to this id, so the LLM does NOT need to " +
      "emit Button components for those actions. Typical slot contents: " +
      "imageId → Image, titleId → Text, subtitleId → Text (neighborhood), " +
      "priceRowId → Row of two Text components (rent + specs), " +
      "descriptionId → Text or TextBlock.",
    props: z.object({
      apartmentId: z.string(),
      imageId: z.string().optional(),
      titleId: z.string().optional(),
      subtitleId: z.string().optional(),
      priceRowId: z.string().optional(),
      descriptionId: z.string().optional(),
    }),
  },
  Badge: {
    description: "A small colored tag for categories or status.",
    props: z.object({
      text: z.string(),
      variant: z
        .enum(["success", "warning", "info", "neutral"])
        .optional(),
    }),
  },
  DetailSection: {
    description: "A titled section within a detail view.",
    props: z.object({
      title: z.string(),
      child: z.string(),
    }),
  },
  TextBlock: {
    description: "A block of body text.",
    props: z.object({
      text: z.string(),
    }),
  },
  ListItem: {
    description: "A single item in a vertical list.",
    props: z.object({
      text: z.string(),
      icon: z.string().optional(),
    }),
  },
  Image: {
    description: "An image element.",
    props: z.object({
      url: z.string(),
      alt: z.string().optional(),
    }),
  },
  CardGrid: {
    description:
      "A responsive grid for laying out a list of cards (e.g. apartment " +
      "listings, search results). Children is an array of component IDs. " +
      "Adapts to screen size automatically using CSS grid auto-fit. Use " +
      "minColumnWidth to tune density (smaller = more, narrower columns). " +
      "Use maxColumns to cap the column count on wide screens. Prefer " +
      "CardGrid over Row for any list of similar card-shaped items.",
    props: z.object({
      children: z.array(z.string()),
      minColumnWidth: z
        .number()
        .optional()
        .describe("Minimum card width in pixels before reflowing to fewer columns. Default 280."),
      gap: z
        .number()
        .optional()
        .describe("Gap between cards in pixels. Default 16."),
      maxColumns: z
        .number()
        .optional()
        .describe("Maximum number of columns even on very wide screens. Optional — unbounded by default."),
    }),
  },
};

export type ApartmentCatalogDefinitions = typeof apartmentCatalogDefinitions;
// #endregion genui
