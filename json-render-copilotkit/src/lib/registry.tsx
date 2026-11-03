// #region genui - Ordinary React primitives; there is no prebuilt listing, detail page or form.
import { createElement } from "react";
import { defineRegistry, useActions } from "@json-render/react";
import { catalog } from "./catalog";
import { formatMetric } from "./format-metric";

export const { registry } = defineRegistry(catalog, {
  actions: {
    view_apartment: async () => {},
    schedule_tour: async () => {},
    compare_apartments: async () => {},
    back_to_results: async () => {},
    submit_tour: async () => {},
  },
  components: {
    Stack: ({ props, children }) => (
      <div
        className={`ui-stack gap-${props.gap ?? "md"} pad-${props.padding ?? "none"}`}
      >
        {children}
      </div>
    ),
    Row: ({ props, children }) => (
      <div
        className={`ui-row gap-${props.gap ?? "md"} align-${props.align ?? "start"}`}
      >
        {children}
      </div>
    ),
    Grid: ({ props, children }) => (
      <div
        className={`ui-grid cols-${props.columns ?? "2"} gap-${props.gap ?? "md"}`}
      >
        {children}
      </div>
    ),
    Card: ({ props, children }) => (
      <section
        data-record-id={props.recordId}
        className={`ui-card ${props.variant ?? "outlined"} pad-${props.padding ?? "none"}`}
      >
        {children}
      </section>
    ),
    Divider: () => <hr className="ui-divider" />,
    Heading: ({ props }) =>
      createElement(
        props.level ?? "h3",
        { className: "ui-heading" },
        props.text,
      ),
    Text: ({ props }) => (
      <p className={`ui-copy ${props.tone ?? "default"}`}>{props.content}</p>
    ),
    Image: ({ props }) => (
      <img
        className={`ui-image ${props.aspect ?? "landscape"}`}
        src={props.src}
        alt={props.alt ?? ""}
        loading="lazy"
      />
    ),
    Badge: ({ props }) => (
      <span className={`ui-badge ${props.tone ?? "neutral"}`}>
        {props.text}
      </span>
    ),
    Metric: ({ props }) => (
      <div className={`ui-metric ${props.emphasis ? "emphasis" : ""}`}>
        <span>{props.label}</span>
        <strong>{formatMetric(props.value, props.format)}</strong>
      </div>
    ),
    List: ({ children }) => <ul className="ui-list">{children}</ul>,
    ListItem: ({ children }) => <li>{children}</li>,
    Button: ({ props, emit }) => (
      <button
        type={props.type ?? "button"}
        className={`ui-button ${props.variant ?? "primary"}`}
        onClick={props.type === "submit" ? undefined : () => emit("press")}
      >
        {props.label}
        <span aria-hidden="true">↗</span>
      </button>
    ),
    Form: function Form({ props, children }) {
      const { execute } = useActions();
      return (
        <form
          className="ui-form"
          aria-label={props.label}
          data-apartment-id={props.apartmentId}
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            if (!form.reportValidity()) return;
            void execute({
              action: "submit_tour",
              params: {
                apartmentId: props.apartmentId,
                details: Object.fromEntries(new FormData(form)),
              },
            });
          }}
        >
          {children}
          <small className="ui-demo-note">
            Demo only. No booking is made and no message is sent.
          </small>
        </form>
      );
    },
    Input: ({ props }) => (
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
    ),
    Select: ({ props }) => (
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
          {(props.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    ),
    Checkbox: ({ props }) => (
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
    ),
    Textarea: ({ props }) => (
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
    ),
  },
});
// #endregion genui
