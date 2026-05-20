// #region genui - json-render React component registry. Each component receives `{ props, children, emit, on, bindings, loading }` from the renderer; `emit("press")` resolves to whatever action binding the model attached to that event in the spec.
import type { ReactNode } from "react";
import { defineRegistry } from "@json-render/react";
import { catalog } from "./catalog";

/**
 * Visual style for buttons. The catalog narrows `variant` to one of these
 * three values via Zod's `enum`, so the model can only emit a known style.
 */
type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonClass = (variant: ButtonVariant = "primary") => {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lagoon)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--foam)] disabled:opacity-50 disabled:pointer-events-none";
  switch (variant) {
    case "secondary":
      return `${base} border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] hover:bg-[var(--link-bg-hover)]`;
    case "ghost":
      return `${base} text-[var(--lagoon-deep)] hover:bg-[var(--link-bg-hover)]`;
    case "primary":
    default:
      return `${base} bg-[var(--lagoon)] text-white shadow-sm hover:bg-[var(--lagoon-deep)]`;
  }
};

const Chip = ({ children }: { children: ReactNode }) => (
  <span
    className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium text-[var(--sea-ink)]"
    style={{
      background: "var(--chip-bg)",
      borderColor: "var(--chip-line)",
    }}
  >
    {children}
  </span>
);

/**
 * The registry binds each catalog component name to a React implementation.
 * `defineRegistry` is type-checked against the catalog so missing or extra
 * components fail at compile time. It returns `{ registry, handlers,
 * executeAction }`; we plug `registry` into `<Renderer />` and let the host
 * wire `handlers` into `<ActionProvider />`.
 *
 * Catalog actions are required here because the catalog declares them. The
 * implementations are intentional no-ops — the host (ChatInterface /
 * SurfaceApp) routes real action behavior (navigation, view state) through
 * `<ActionProvider handlers={{ ... }} />` since that logic depends on host
 * state outside the json-render state model.
 */
export const { registry, handlers, executeAction } = defineRegistry(catalog, {
  actions: {
    view_apartment: async () => {},
    schedule_tour: async () => {},
    back_to_results: async () => {},
    submit_tour: async () => {},
  },
  components: {
    // Plain text block. `props.content` is the inferred string from the Zod schema.
    Text: ({ props }) => (
      <p className="text-[var(--sea-ink)] leading-relaxed">{props.content}</p>
    ),

    // Button calls `emit("press")` on click. The renderer turns that emit into
    // whatever action binding the model attached to the button's `on.press`.
    Button: ({ props, emit }) => (
      <button
        type="button"
        className={buttonClass(props.variant as ButtonVariant)}
        onClick={() => emit("press")}
      >
        {props.label}
      </button>
    ),

    // Summary card for one apartment. The model places "View Details" /
    // "Schedule Tour" Buttons in the default slot, which we render via `children`.
    ApartmentCard: ({ props, children }) => (
      <article className="island-shell rise-in flex flex-col overflow-hidden rounded-2xl">
        {props.imageUrl ? (
          <div className="relative h-36 w-full overflow-hidden">
            <img
              src={props.imageUrl}
              alt={props.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-3 p-4">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--sea-ink)]">
                {props.title}
              </h3>
              <p className="text-sm text-[var(--sea-ink-soft)]">
                {props.neighborhood}
              </p>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold text-[var(--lagoon-deep)]">
                {props.rent}
              </p>
            </div>
          </header>
          <dl className="flex flex-wrap gap-2 text-xs text-[var(--sea-ink-soft)]">
            <Chip>{props.bedrooms}</Chip>
            <Chip>{props.sqft}</Chip>
          </dl>
          {children ? (
            <div className="flex flex-wrap gap-2 pt-1">{children}</div>
          ) : null}
        </div>
      </article>
    ),

    // Container for a list of cards. Renders an optional title plus a
    // responsive grid of whatever the model emitted into the slot.
    ApartmentList: ({ props, children }) => (
      <section className="flex flex-col gap-4">
        {props.title ? (
          <h2 className="text-lg font-semibold text-[var(--sea-ink)]">
            {props.title}
          </h2>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      </section>
    ),

    DetailView: ({ props, children }) => (
      <article className="island-shell rise-in flex flex-col gap-4 overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-1 px-5 pt-5">
          <h2 className="text-xl font-semibold text-[var(--sea-ink)]">
            {props.title}
          </h2>
          {props.subtitle ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">{props.subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-4 px-5 pb-5">{children}</div>
      </article>
    ),

    Image: ({ props }) => (
      <div className="relative -mx-5 -mt-4 aspect-[16/9] w-[calc(100%+2.5rem)] overflow-hidden">
        <img
          src={props.src}
          alt={props.alt}
          className="h-full w-full object-cover"
        />
      </div>
    ),

    InfoBar: ({ props }) => (
      <div className="flex flex-wrap gap-2">
        {props.items.map((item: string, i: number) => (
          <Chip key={i}>{item}</Chip>
        ))}
      </div>
    ),

    TagGroup: ({ props }) => (
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--kicker)]">
          {props.label}
        </h4>
        <div className="flex flex-wrap gap-2">
          {props.tags.map((tag: string, i: number) => (
            <Chip key={i}>{tag}</Chip>
          ))}
        </div>
      </div>
    ),

    // Tour scheduling form. Form fields are static HTML — none of the other
    // standalone apps wire form state through actions either, so we keep the
    // form local and only the submit/cancel Buttons (rendered separately by
    // the model in the spec) emit actions.
    TourForm: ({ props, children }) => {
      const inputClass =
        "w-full rounded-lg border bg-white/70 px-3 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lagoon)]";
      return (
        <div
          className="island-shell rise-in flex flex-col gap-4 rounded-2xl p-5 tour-form"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-[var(--sea-ink)]">
              Schedule a tour
            </h3>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              {props.apartmentTitle}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--sea-ink-soft)]">
              Name
              <input
                name="name"
                type="text"
                placeholder="Jane Doe"
                className={inputClass}
                style={{ borderColor: "var(--line)" }}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--sea-ink-soft)]">
              Email
              <input
                name="email"
                type="email"
                placeholder="jane@example.com"
                className={inputClass}
                style={{ borderColor: "var(--line)" }}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--sea-ink-soft)]">
              Phone
              <input
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                className={inputClass}
                style={{ borderColor: "var(--line)" }}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--sea-ink-soft)]">
              Preferred date
              <input
                name="date"
                type="date"
                className={inputClass}
                style={{ borderColor: "var(--line)" }}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-[var(--sea-ink-soft)]">
            Message
            <textarea
              name="message"
              rows={3}
              placeholder="Anything specific you'd like to ask?"
              className={inputClass}
              style={{ borderColor: "var(--line)" }}
            />
          </label>

          {children ? (
            <div className="flex flex-wrap gap-2 pt-1">{children}</div>
          ) : null}
        </div>
      );
    },

    // Success confirmation. The model nests a "Back to Search" Button into the
    // default slot which we render at the bottom.
    Confirmation: ({ props, children }) => (
      <div
        className="island-shell rise-in flex flex-col gap-3 rounded-2xl p-5"
        style={{
          borderColor: "var(--palm)",
          boxShadow:
            "0 1px 0 var(--inset-glint) inset, 0 18px 36px rgba(47, 106, 74, 0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white"
            style={{ background: "var(--palm)" }}
            aria-hidden
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <h3 className="text-base font-semibold text-[var(--sea-ink)]">
            {props.title}
          </h3>
        </div>
        <p className="text-sm text-[var(--sea-ink)]">{props.message}</p>
        {children ? (
          <div className="flex flex-wrap gap-2 pt-1">{children}</div>
        ) : null}
      </div>
    ),
  },
});
// #endregion genui
