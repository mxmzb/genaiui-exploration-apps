// #region genui - A small vocabulary: the model composes the layout, content, fields and actions.
import { createElement, useContext } from "react";
import { GenerationRunning } from "./generation-state";
import {
  createGenerativeUI,
  type GenerativeUIComponentName,
  type GenerativeUIComponentProps,
} from "@copilotkit/react-core/v2/generative-ui";
import { formatMetric } from "./format-metric";
import { z } from "zod";

const gap = z.enum(["sm", "md", "lg"]).default("md");
const padding = z.enum(["none", "sm", "md", "lg"]).default("none");
const field = {
  name: z.string().describe("Unique field name within its Form"),
  label: z.string(),
  required: z.boolean().default(false),
};

export const apartmentUI = createGenerativeUI({
  id: "apartment-finder@1",
  components: {
    Stack: {
      component: Stack,
      description:
        "Vertical layout. Nest content and other layouts; padding can create a card body.",
      props: z.object({
        gap,
        padding,
        visible: z
          .boolean()
          .default(true)
          .describe(
            "Conditional content. Bind a boolean or a basic function result.",
          ),
      }),
      slots: { children: "multiple" },
    },
    Row: {
      component: Row,
      description: "Wrapping horizontal layout for badges, metrics or actions.",
      props: z.object({
        gap,
        align: z.enum(["start", "center", "between"]).default("start"),
      }),
      slots: { children: "multiple" },
    },
    Grid: {
      component: Grid,
      description:
        "Responsive equal-width columns. Collapses on narrow screens; may be nested.",
      props: z.object({ columns: z.enum(["1", "2", "3"]).default("2"), gap }),
      slots: { children: "multiple" },
    },
    Card: {
      component: Card,
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
      slots: { children: "multiple" },
    },
    Divider: {
      component: Divider,
      description: "A quiet horizontal rule.",
      props: z.object({}),
    },
    Heading: {
      component: Heading,
      description: "A section or card heading.",
      props: z.object({
        text: z
          .string()
          .optional()
          .describe(
            "May be pending during streaming; required in the finished view",
          ),
        level: z.enum(["h2", "h3", "h4"]).default("h3"),
      }),
    },
    Text: {
      component: Text,
      description: "Plain text, with a bounded emphasis. Never HTML.",
      props: z.object({
        content: z
          .string()
          .optional()
          .describe(
            "May be pending during streaming; required in the finished view",
          ),
        tone: z.enum(["default", "muted", "eyebrow"]).default("default"),
      }),
    },
    Image: {
      component: Image,
      description:
        "One supplied illustrative photo. Compose galleries with Grid and multiple Images.",
      props: z.object({
        src: z
          .string()
          .optional()
          .describe(
            "May be pending during streaming; use a supplied photo URL",
          ),
        alt: z.string(),
        aspect: z.enum(["landscape", "square", "wide"]).default("landscape"),
      }),
    },
    Badge: {
      component: Badge,
      description: "A short category, constraint or status label.",
      props: z.object({
        text: z.string().optional(),
        tone: z.enum(["neutral", "accent", "warning"]).default("neutral"),
      }),
    },
    Metric: {
      component: Metric,
      description:
        "One labeled value. Use numeric values with a format for money/area; null means unknown. Formatting is handled by React, never by templates.",
      props: z.object({
        label: z.string(),
        value: z
          .union([z.number(), z.string(), z.null()])
          .optional()
          .describe(
            "Undefined is still arriving; null is a genuinely unknown fact. Supply by the end.",
          ),
        format: z.enum(["text", "usd", "usd/month", "sqft"]).default("text"),
        emphasis: z.boolean().default(false),
      }),
    },
    List: {
      component: List,
      description:
        "A semantic list of ListItem children, e.g. amenities or nearby transit.",
      props: z.object({}),
      slots: { children: "multiple" },
    },
    ListItem: {
      component: ListItem,
      description:
        "One list item. Put Text, Metric or other content in its children.",
      props: z.object({}),
      slots: { children: "multiple" },
    },
    Button: {
      component: Button,
      events: {
        onClick: {
          description:
            "Navigate to details, a tour form, a comparison or the previous search.",
          parameters: z.object({}),
        },
      },
      description:
        "A button. Regular buttons bind onClick; a submit button submits its enclosing Form.",
      props: z.object({
        label: z.string(),
        variant: z.enum(["primary", "secondary", "ghost"]).default("primary"),
        type: z.enum(["button", "submit"]).default("button"),
      }),
    },
    Form: {
      component: Form,
      events: {
        onSubmit: {
          description:
            "Collect this demo request. No booking or message is sent.",
          parameters: z.object({
            apartmentId: z.string(),
            details: z.record(z.string(), z.string()),
          }),
        },
      },
      description:
        "Empty demo-request form. Generate every field and a submit Button as children. Never nest Forms. Submission collects only this form's values.",
      props: z.object({
        apartmentId: z.string(),
        label: z.string().describe("Accessible form name"),
      }),
      slots: { children: "multiple" },
    },
    Input: {
      component: Input,
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
      component: Select,
      description: "A labeled native select inside a Form.",
      props: z.object({
        ...field,
        options: z.array(z.object({ value: z.string(), label: z.string() })),
        defaultValue: z.string().optional(),
      }),
    },
    Checkbox: {
      component: Checkbox,
      description:
        "A labeled checkbox inside a Form. An unchecked box is omitted from the submitted values.",
      props: z.object({ ...field, defaultChecked: z.boolean().default(false) }),
    },
    Textarea: {
      component: Textarea,
      description: "A labeled multiline input inside a Form.",
      props: z.object({
        ...field,
        placeholder: z.string().optional(),
        defaultValue: z.string().optional(),
      }),
    },
  },
});

type Props<Name extends GenerativeUIComponentName<typeof apartmentUI>> =
  GenerativeUIComponentProps<typeof apartmentUI, Name>;

function Stack({ gap, padding, visible, children }: Props<"Stack">) {
  if (visible === false) return null;
  return (
    <div className={`ui-stack gap-${gap ?? "md"} pad-${padding ?? "none"}`}>
      {children}
    </div>
  );
}
function Row({ gap, align, children }: Props<"Row">) {
  return (
    <div className={`ui-row gap-${gap ?? "md"} align-${align ?? "start"}`}>
      {children}
    </div>
  );
}
function Grid({ columns, gap, children }: Props<"Grid">) {
  return (
    <div className={`ui-grid cols-${columns ?? "2"} gap-${gap ?? "md"}`}>
      {children}
    </div>
  );
}
function Card({ recordId, variant, padding, children }: Props<"Card">) {
  return (
    <section
      data-record-id={recordId}
      className={`ui-card ${variant ?? "outlined"} pad-${padding ?? "none"}`}
    >
      {children}
    </section>
  );
}
function Divider() {
  return <hr className="ui-divider" />;
}
function Heading({ level, text }: Props<"Heading">) {
  return createElement(
    level ?? "h3",
    { className: "ui-heading" },
    text ?? <Pending />,
  );
}
function Text({ content, tone }: Props<"Text">) {
  return (
    <p className={`ui-copy ${tone ?? "default"}`}>{content ?? <Pending />}</p>
  );
}
function Image({ src, alt, aspect }: Props<"Image">) {
  if (src === undefined)
    return (
      <div className={`ui-image pending-image ${aspect ?? "landscape"}`}>
        <Pending />
      </div>
    );
  return (
    <img
      className={`ui-image ${aspect ?? "landscape"}`}
      src={src}
      alt={alt}
      loading="lazy"
    />
  );
}
function Badge({ text, tone }: Props<"Badge">) {
  return (
    <span className={`ui-badge ${tone ?? "neutral"}`}>
      {text ?? <Pending />}
    </span>
  );
}
function Pending() {
  const running = useContext(GenerationRunning);
  return (
    <span className="ui-pending" data-pending="true">
      {running ? "Loading…" : "Unavailable"}
    </span>
  );
}
function Metric({ label, value, format, emphasis }: Props<"Metric">) {
  return (
    <div className={`ui-metric ${emphasis ? "emphasis" : ""}`}>
      <span>{label}</span>
      <strong>
        {value === undefined ? <Pending /> : formatMetric(value, format)}
      </strong>
    </div>
  );
}
function List({ children }: Props<"List">) {
  return <ul className="ui-list">{children}</ul>;
}
function ListItem({ children }: Props<"ListItem">) {
  return <li>{children}</li>;
}
function Button({ label, type, variant, onClick }: Props<"Button">) {
  return (
    <button
      type={type ?? "button"}
      className={`ui-button ${variant ?? "primary"}`}
      onClick={
        type === "submit"
          ? undefined
          : () => {
              void onClick?.({});
            }
      }
    >
      {label}
      <span aria-hidden="true">↗</span>
    </button>
  );
}
function Form({ apartmentId, label, children, onSubmit }: Props<"Form">) {
  return (
    <form
      className="ui-form"
      aria-label={label}
      data-apartment-id={apartmentId}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const details = Object.fromEntries(
          Array.from(new FormData(form), ([key, value]) => [
            key,
            String(value),
          ]),
        );
        void onSubmit?.({ apartmentId, details });
      }}
    >
      {children}
      <small className="ui-demo-note">
        Demo only. No booking is made and no message is sent.
      </small>
    </form>
  );
}
function Input(props: Props<"Input">) {
  return (
    <label className="ui-field">
      <span>
        {props.label}
        {props.required && <small> (required)</small>}
      </span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        min={props.min}
        max={props.max}
      />
    </label>
  );
}
function Select(props: Props<"Select">) {
  return (
    <label className="ui-field">
      <span>
        {props.label}
        {props.required && <small> (required)</small>}
      </span>
      <select
        name={props.name}
        required={props.required}
        defaultValue={props.defaultValue ?? ""}
      >
        <option value="">Choose an option</option>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function Checkbox(props: Props<"Checkbox">) {
  return (
    <label className="ui-checkbox">
      <input
        type="checkbox"
        name={props.name}
        required={props.required}
        defaultChecked={props.defaultChecked}
      />
      <span>
        {props.label}
        {props.required && <small> (required)</small>}
      </span>
    </label>
  );
}
function Textarea(props: Props<"Textarea">) {
  return (
    <label className="ui-field">
      <span>
        {props.label}
        {props.required && <small> (required)</small>}
      </span>
      <textarea
        name={props.name}
        required={props.required}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        rows={3}
      />
    </label>
  );
}
