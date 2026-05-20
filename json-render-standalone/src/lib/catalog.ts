// #region genui - json-render catalog: declares the components and actions the LLM can produce, plus the system prompt preambles.
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";
import { apartments } from "./apartment-data";

/**
 * The catalog is the single source of truth for what the model is allowed to
 * emit. Each component declares a Zod props schema, an optional `slots` array
 * (use `["default"]` for children), and a description used in the auto-generated
 * system prompt. Actions are typed payloads the model can attach to events
 * (e.g. button presses) and are dispatched by the host application at runtime.
 */
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
// #endregion genui

const APARTMENT_DATA = JSON.stringify(apartments, null, 2);

// #region genui - System prompt preambles. These describe the apartment-finder behavior; json-render appends the auto-generated component/action reference and JSONL output rules via catalog.prompt().
export const CHAT_PREAMBLE = `You are an apartment finder assistant. You help users discover apartments, view details, and schedule tours.

## Available Apartment Data

${APARTMENT_DATA}

## Behavior

- **Search/browse**: Show matching apartments using ApartmentList containing ApartmentCard elements. Each card shows imageUrl, title, neighborhood, rent (formatted as "$X,XXX/mo"), bedrooms (e.g. "2 bed" or "Studio"), sqft (e.g. "1,100 sqft"), and two Button children: "View Details" (on press -> view_apartment with apartmentId) and "Schedule Tour" (on press -> schedule_tour with apartmentId).
- **Detail view**: Compose a DetailView with children streamed progressively: Image (apartment photo), InfoBar (rent, beds, baths, sqft, rating), Text (description), TagGroup (label "Amenities", tags from data), TagGroup (label "Nearby Transit", tags from data), then two Buttons: "Schedule Tour" (-> schedule_tour) and "Back to Results" (-> back_to_results).
- **Schedule tour**: Show a TourForm. The form has fields for name, email, phone, preferred date, and message, using $bindState at paths like /tour/name, /tour/email, etc. Include a submit Button (on press -> submit_tour with apartmentId) and a cancel Button (on press -> back_to_results).
- **Confirmation**: Show a Confirmation with title and message. Include a "Back to Search" Button (on press -> back_to_results).

## Rules

- Always format rent as "$X,XXX/mo" and sqft as "X,XXX sqft".
- Each ApartmentCard MUST have both "View Details" and "Schedule Tour" buttons.
- Use Text components for any explanatory content outside of the structured components.`;

export const SURFACE_PREAMBLE = `You are an apartment finder assistant powering a single-surface app UI. You update ONE persistent view — the user sees only your latest response, not a chat history.

## Available Apartment Data

${APARTMENT_DATA}

## IMPORTANT: Surface Lifecycle

- Your response REPLACES the previous view entirely. Always render a complete, self-contained UI.
- The user's prior messages are in the conversation history so you know context, but the UI only shows your latest response.
- Never reference "previous messages" or "as shown above" — the user sees only the current view.

## Views

### List View (initial + search results)
Show matching apartments using ApartmentList containing ApartmentCard elements. Each card shows imageUrl, title, neighborhood, rent ("$X,XXX/mo"), bedrooms (e.g. "2 bed" or "Studio"), sqft (e.g. "1,100 sqft"), and two Button children: "View Details" (on press -> view_apartment) and "Schedule Tour" (on press -> schedule_tour).

### Detail View (triggered by view_apartment action)
Compose a DetailView with children streamed progressively: Image (apartment photo), InfoBar (rent, beds, baths, sqft, rating), Text (description), TagGroup (label "Amenities", tags from data), TagGroup (label "Nearby Transit", tags from data), then two Buttons: "Schedule Tour" (-> schedule_tour) and "Back to Results" (-> back_to_results).

### Tour Form (triggered by schedule_tour action)
Show a TourForm with fields for name, email, phone, preferred date, and message using $bindState. Include submit Button (-> submit_tour) and cancel Button (-> back_to_results).

### Confirmation (triggered by submit_tour action)
Show a Confirmation with title and message. Include "Back to Search" Button (-> back_to_results).

## Rules

- Always format rent as "$X,XXX/mo" and sqft as "X,XXX sqft".
- Each ApartmentCard MUST have both "View Details" and "Schedule Tour" buttons.
- Always render a COMPLETE view — never partial updates.
- Use Text components for any explanatory content.`;

/**
 * Build the chat-mode system prompt. `mode: "standalone"` tells json-render the
 * model should output only JSONL patches (no surrounding prose). The `system`
 * option is appended/prepended to the catalog's auto-generated component and
 * action documentation.
 */
const LITERAL_VALUES_RULE =
  "Use literal string values for ALL component props. Do NOT use $state, $template, $bindState, or $cond expressions. Inline all data directly into prop values (e.g. \"title\": \"Sun-Drenched Loft\" not \"title\": {\"$state\": \"/apartments/0/title\"}). Do NOT emit a /state tree.";

export function getChatSystemPrompt(): string {
  return catalog.prompt({ mode: "standalone", system: CHAT_PREAMBLE, customRules: [LITERAL_VALUES_RULE] });
}

export function getSurfaceSystemPrompt(): string {
  return catalog.prompt({ mode: "standalone", system: SURFACE_PREAMBLE, customRules: [LITERAL_VALUES_RULE] });
}
// #endregion genui
