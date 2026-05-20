// #region genui - json-render catalog: declares the components and actions the LLM can produce.
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

export const catalog = defineCatalog(schema, {
  components: {
    Text: {
      description: "A block of text content",
      props: z.object({
        content: z.string().describe("The text to display"),
      }),
    },
    Button: {
      description: "A clickable button that emits a 'press' event",
      props: z.object({
        label: z.string().describe("Button text"),
        variant: z
          .enum(["primary", "secondary", "ghost"])
          .default("primary")
          .describe("Visual style"),
      }),
    },
    ApartmentCard: {
      description: "Summary card for one apartment listing with image",
      props: z.object({
        id: z.string().describe("Apartment ID"),
        title: z.string().describe("Apartment title"),
        neighborhood: z.string().describe("Neighborhood name"),
        rent: z.string().describe("Monthly rent, e.g. '$3,100/mo'"),
        bedrooms: z.string().describe("Bedroom count with label, e.g. '2 bed' or 'Studio'"),
        sqft: z.string().describe("Square footage, e.g. '1,100 sqft'"),
        imageUrl: z.string().describe("Apartment photo URL from the data"),
      }),
      slots: ["default"],
    },
    ApartmentList: {
      description: "Container for a grid of ApartmentCard elements",
      props: z.object({
        title: z.string().optional().describe("Section heading"),
      }),
      slots: ["default"],
    },
    DetailView: {
      description: "Container card for a detail page. Place Image, InfoBar, Text, TagGroup, and Button children inside it — each streams independently.",
      props: z.object({
        title: z.string().describe("Apartment title"),
        subtitle: z.string().optional().describe("e.g. neighborhood name"),
      }),
      slots: ["default"],
    },
    Image: {
      description: "A full-width image",
      props: z.object({
        src: z.string().describe("Image URL"),
        alt: z.string().describe("Alt text"),
      }),
    },
    InfoBar: {
      description: "Horizontal row of key stats shown as chips",
      props: z.object({
        items: z.array(z.string()).describe("Stat values, e.g. ['$3,100/mo', '2 bed', '2 bath', '1,100 sqft', '★ 4.5 (2 reviews)']"),
      }),
    },
    TagGroup: {
      description: "Labeled group of tags/chips",
      props: z.object({
        label: z.string().describe("Section heading, e.g. 'Amenities' or 'Nearby Transit'"),
        tags: z.array(z.string()).describe("Tag values"),
      }),
    },
    TourForm: {
      description:
        "Tour scheduling form with name, email, phone, date, message fields. Place submit and cancel Buttons as children.",
      props: z.object({
        apartmentId: z.string(),
        apartmentTitle: z.string(),
      }),
      slots: ["default"],
    },
    Confirmation: {
      description: "Success confirmation alert",
      props: z.object({
        title: z.string(),
        message: z.string(),
      }),
      slots: ["default"],
    },
  },
  actions: {
    view_apartment: {
      description: "View full details for an apartment",
      params: z.object({ apartmentId: z.string() }),
    },
    schedule_tour: {
      description: "Open tour scheduling form for an apartment",
      params: z.object({ apartmentId: z.string() }),
    },
    back_to_results: {
      description: "Navigate back to the apartment listing",
      params: z.object({}),
    },
    submit_tour: {
      description: "Submit the tour request form",
      params: z.object({ apartmentId: z.string() }),
    },
  },
});

const LITERAL_VALUES_RULE =
  "Use literal string values for ALL component props. Do NOT use $state, $template, $bindState, or $cond expressions. Inline all data directly into prop values (e.g. \"title\": \"Sun-Drenched Loft\" not \"title\": {\"$state\": \"/apartments/0/title\"}). Do NOT emit a /state tree.";

export function getGenerateUiPrompt(): string {
  const preamble = `You are a UI generation tool. You receive apartment data and a layout instruction, and you output json-render JSONL that renders interactive apartment-finding UI.

## Rules

- Always format rent as "$X,XXX/mo" and sqft as "X,XXX sqft".
- Each ApartmentCard MUST have both "View Details" and "Schedule Tour" buttons as children.
- Use Text components for any explanatory content.
- When data is provided, use literal values from it to populate component props.`;

  return catalog.prompt({ mode: "standalone", system: preamble, customRules: [LITERAL_VALUES_RULE] });
}
// #endregion genui
