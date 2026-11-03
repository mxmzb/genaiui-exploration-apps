// #region genui - A small vocabulary: the model composes the layout, content, fields and actions.
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";
import { compositionRules } from "./ui-instructions";

const gap = z.enum(["sm", "md", "lg"]).default("md");
const padding = z.enum(["none", "sm", "md", "lg"]).default("none");
const field = {
  name: z.string().describe("Unique field name within its Form"),
  label: z.string(),
  required: z.boolean().default(false),
};

export const catalog = defineCatalog(schema, {
  components: {
    Stack: {
      description:
        "Vertical layout. Nest content and other layouts; padding can create a card body.",
      props: z.object({ gap, padding }),
      slots: ["default"],
    },
    Row: {
      description: "Wrapping horizontal layout for badges, metrics or actions.",
      props: z.object({
        gap,
        align: z.enum(["start", "center", "between"]).default("start"),
      }),
      slots: ["default"],
    },
    Grid: {
      description:
        "Responsive equal-width columns. Collapses on narrow screens; may be nested.",
      props: z.object({ columns: z.enum(["1", "2", "3"]).default("2"), gap }),
      slots: ["default"],
    },
    Card: {
      description:
        "An empty visual container, not a listing template. Compose all content as children.",
      props: z.object({
        variant: z.enum(["plain", "outlined", "accent"]).default("outlined"),
        padding,
        recordId: z
          .string()
          .optional()
          .describe("ID of the record this container represents, if any"),
      }),
      slots: ["default"],
    },
    Divider: { description: "A quiet horizontal rule.", props: z.object({}) },
    Heading: {
      description: "A section or card heading.",
      props: z.object({
        text: z.string(),
        level: z.enum(["h2", "h3", "h4"]).default("h3"),
      }),
    },
    Text: {
      description: "Plain text, with a bounded emphasis. Never HTML.",
      props: z.object({
        content: z.string(),
        tone: z.enum(["default", "muted", "eyebrow"]).default("default"),
      }),
    },
    Image: {
      description:
        "One supplied illustrative photo. Compose galleries with Grid and multiple Images.",
      props: z.object({
        src: z.string(),
        alt: z.string(),
        aspect: z.enum(["landscape", "square", "wide"]).default("landscape"),
      }),
    },
    Badge: {
      description: "A short category, constraint or status label.",
      props: z.object({
        text: z.string(),
        tone: z.enum(["neutral", "accent", "warning"]).default("neutral"),
      }),
    },
    Metric: {
      description:
        "One labeled value. Use numeric values with a format for money/area; null means unknown. Formatting is handled by React, never by templates.",
      props: z.object({
        label: z.string(),
        value: z.union([z.number(), z.string(), z.null()]),
        format: z.enum(["text", "usd", "usd/month", "sqft"]).default("text"),
        emphasis: z.boolean().default(false),
      }),
    },
    List: {
      description:
        "A semantic list of ListItem children, e.g. amenities or nearby transit.",
      props: z.object({}),
      slots: ["default"],
    },
    ListItem: {
      description:
        "One list item. Put Text, Metric or other content in its children.",
      props: z.object({}),
      slots: ["default"],
    },
    Button: {
      description:
        "A button. Regular buttons bind on.press; a submit button submits its enclosing Form.",
      props: z.object({
        label: z.string(),
        variant: z.enum(["primary", "secondary", "ghost"]).default("primary"),
        type: z.enum(["button", "submit"]).default("button"),
      }),
    },
    Form: {
      description:
        "Empty demo-request form. Generate every field and a submit Button as children. Never nest Forms. Submission collects only this form's values.",
      props: z.object({
        apartmentId: z.string(),
        label: z.string().describe("Accessible form name"),
      }),
      slots: ["default"],
    },
    Input: {
      description:
        "A labeled native input inside a Form. Dates may specify an ISO min value.",
      props: z.object({
        ...field,
        type: z
          .enum(["text", "email", "tel", "date", "number"])
          .default("text"),
        placeholder: z.string().optional(),
        defaultValue: z.string().optional(),
        min: z.string().optional(),
        max: z.string().optional(),
      }),
    },
    Select: {
      description: "A labeled native select inside a Form.",
      props: z.object({
        ...field,
        options: z.array(z.object({ value: z.string(), label: z.string() })),
        defaultValue: z.string().optional(),
      }),
    },
    Checkbox: {
      description:
        "A labeled checkbox inside a Form. An unchecked box is omitted from the submitted values.",
      props: z.object({ ...field, defaultChecked: z.boolean().default(false) }),
    },
    Textarea: {
      description: "A labeled multiline input inside a Form.",
      props: z.object({
        ...field,
        placeholder: z.string().optional(),
        defaultValue: z.string().optional(),
      }),
    },
  },
  actions: {
    view_apartment: {
      description: "Inspect one apartment.",
      params: z.object({ apartmentId: z.string() }),
    },
    schedule_tour: {
      description: "Generate a demo request form for one apartment.",
      params: z.object({ apartmentId: z.string() }),
    },
    compare_apartments: {
      description: "Compare two or three apartments.",
      params: z.object({ apartmentIds: z.array(z.string()).min(2).max(3) }),
    },
    back_to_results: {
      description: "Return to the last search with its filters.",
      params: z.object({}),
    },
    submit_tour: {
      description:
        "Called by the Form implementation with its collected values. Do not bind this to on.press.",
      params: z.object({
        apartmentId: z.string(),
        details: z.record(z.string(), z.string()),
      }),
    },
  },
});
// #endregion genui

export function getGenerateUiPrompt(): string {
  return catalog.prompt({ mode: "standalone", customRules: [compositionRules] });
}
