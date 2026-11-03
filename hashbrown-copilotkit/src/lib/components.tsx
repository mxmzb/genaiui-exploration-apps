import { createContext, createElement, useContext, type ReactNode } from "react";
import { exposeComponent } from "@hashbrownai/react";
import { s } from "@hashbrownai/core";
import { definitions, navigationAction, type UIAction } from "./catalog";
import { GenerationRunning } from "./generation-state";
import { formatMetric } from "./format-metric";
export const ActionContext = createContext<(action: UIAction) => void>(() => {});
type Props<N extends keyof typeof definitions> = { [P in keyof typeof definitions[N]["props"]]: typeof definitions[N]["props"][P] extends s.HashbrownType ? s.Infer<typeof definitions[N]["props"][P]> : never } & { children?: ReactNode };
const renderers = { Stack, Row, Grid, Card, Divider, Heading, Text, Image, Badge, Metric, List, ListItem, Button, Form, Input, Select, Checkbox, Textarea };
// Erase only this heterogeneous registry boundary. Each renderer's Props derives
// from its actual Skillet definition; native validation still checks model output.
export const apartmentComponents = (Object.keys(definitions) as (keyof typeof definitions)[]).map(name =>
  exposeComponent(renderers[name] as React.ComponentType<any>, { name, ...definitions[name], fallback: Pending } as any),
);
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
    level && ["h2", "h3", "h4"].includes(level) ? level : "h3",
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
function Button({ label, type, variant, action: plan }: Props<"Button">) {
  const dispatch = useContext(ActionContext);
  return (
    <button
      type={type ?? "button"}
      className={`ui-button ${variant ?? "primary"}`}
      onClick={
        type === "submit"
          ? undefined
          : () => {
              if (plan) { navigationAction.validate(plan); dispatch(plan); }
            }
      }
    >
      {label}
      <span aria-hidden="true">↗</span>
    </button>
  );
}
function Form({ apartmentId, label, children }: Props<"Form">) {
  const dispatch = useContext(ActionContext);
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
        dispatch({ name: "submit_tour", apartmentId, details });
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
