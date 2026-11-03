// #region genui - One native Skillet contract shared by server and browser.
import { s, createUiJsonSchema } from "@hashbrownai/core";
const text = (description: string) => s.streaming.string(description);
const str = (description: string) => s.string(description);
const choice = <const T extends readonly string[]>(description: string, values: T) => s.enumeration<T>(description, [...values]);
const gap = choice("Space between children", ["sm", "md", "lg"]);
const padding = choice("Inner spacing", ["none", "sm", "md", "lg"]);
const field = { name: str("Unique field name"), label: text("Visible label"), required: s.boolean("Required input") };
export const navigationAction = s.anyOf([
  s.object("Open details", { name: s.literal("view_apartment"), apartmentId: str("Record ID") }),
  s.object("Open demo tour form", { name: s.literal("schedule_tour"), apartmentId: str("Record ID") }),
  s.object("Return to previous search", { name: s.literal("back_to_results") }),
  s.object("Compare selected records", { name: s.literal("compare_apartments"), apartmentIds: s.array("Record IDs", str("ID")) }),
]);
export type NavigationAction = s.Infer<typeof navigationAction>;
export type UIAction = NavigationAction | { name: "submit_tour"; apartmentId: string; details: Record<string, string> };
export const definitions = {
  Stack: { description: "Vertical layout. Nest layouts and content.", children: "any", props: { gap, padding, visible: s.boolean("Show this content") } },
  Row: { description: "Wrapping horizontal layout for metrics, badges and actions.", children: "any", props: { gap, align: choice("Alignment", ["start", "center", "between"]) } },
  Grid: { description: "Responsive equal-width columns; collapses on narrow screens.", children: "any", props: { columns: choice("Desktop columns", ["1", "2", "3"]), gap } },
  Card: { description: "Empty visual container. Compose all listing content as children.", children: "any", props: { recordId: str("Record ID, or empty string for a generic container"), variant: choice("Treatment", ["plain", "outlined", "accent"]), padding } },
  Divider: { description: "Horizontal rule.", props: {} },
  Heading: { description: "Section or card heading.", props: { level: choice("Heading level", ["h2", "h3", "h4"]), text: text("Heading text") } },
  Text: { description: "Plain text; never HTML.", props: { tone: choice("Emphasis", ["default", "muted", "eyebrow"]), content: text("Text content") } },
  Image: { description: "Supplied illustrative photo. Compose galleries using Grid.", props: { src: str("Supplied complete photo URL"), alt: str("Photo description"), aspect: choice("Aspect ratio", ["landscape", "square", "wide"]) } },
  Badge: { description: "Short category or status.", props: { tone: choice("Treatment", ["neutral", "accent", "warning"]), text: text("Label") } },
  Metric: { description: "Labeled value. Numeric money/area is formatted by React; null means unknown.", props: { label: str("Metric label"), format: choice("Format", ["text", "usd", "usd/month", "sqft"]), emphasis: s.boolean("Highlight value"), value: s.anyOf([s.number("Numeric value"), text("Text value"), s.nullish()]) } },
  List: { description: "Semantic list of ListItem children.", children: "any", props: {} },
  ListItem: { description: "One list item, with Text or other nested content.", children: "any", props: {} },
  Button: { description: "Navigation button, or submit button inside a Form. Submit uses action=null.", props: { label: str("Visible label"), variant: choice("Treatment", ["primary", "secondary", "ghost"]), type: choice("Button type", ["button", "submit"]), action: s.anyOf([navigationAction, s.nullish()]) } },
  Form: { description: "Empty demo-request form. Generate fields and a submit Button as children. Never nest forms.", children: "any", props: { apartmentId: str("Record ID"), label: str("Accessible form name") } },
  Input: { description: "Labeled native input inside Form. Empty string for unused optional attributes.", props: { ...field, type: choice("Input type", ["text", "email", "tel", "date", "number"]), placeholder: str("Placeholder or empty"), defaultValue: str("Initial value; empty for contact details"), min: str("Minimum or empty; ISO date for date inputs"), max: str("Maximum or empty") } },
  Select: { description: "Labeled native select inside Form.", props: { ...field, options: s.array("Choices", s.object("Choice", { value: str("Value"), label: str("Label") })), defaultValue: str("Initial value or empty") } },
  Checkbox: { description: "Native checkbox inside Form. Unchecked values are omitted on submission.", props: { ...field, defaultChecked: s.boolean("Initially checked") } },
  Textarea: { description: "Labeled multiline input inside Form.", props: { ...field, placeholder: str("Placeholder or empty"), defaultValue: str("Initial value or empty") } },
} as const;
export const componentDefinitions = Object.entries(definitions).map(([name, definition]) => ({ name, ...definition }));
export const responseSchema = createUiJsonSchema({ components: componentDefinitions });
// #endregion genui
