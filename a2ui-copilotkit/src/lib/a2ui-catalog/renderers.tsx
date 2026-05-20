// #region genui - A2UI catalog renderers: React components with full styling control (unlike @a2ui/react)
import {
  createCatalog,
  useA2UIActions,
  type CatalogRenderers,
} from "@copilotkit/a2ui-renderer";
import {
  apartmentCatalogDefinitions,
  type ApartmentCatalogDefinitions,
} from "./definitions";

// The schema narrows display props to z.string(), but z.string() is a hint
// to the LLM, not a runtime guarantee — the LLM can still emit {path: "..."}.
// Treat any non-string as absent so unresolved bindings show skeletons rather
// than crashing the React tree.
function asString(val: unknown): string {
  return typeof val === "string" ? val : "";
}

const renderers: CatalogRenderers<ApartmentCatalogDefinitions> = {
  Title: ({ props }) => {
    const text = asString(props.text);
    const level = props.level ?? "h2";
    const sizes = { h1: "1.75rem", h2: "1.35rem", h3: "1.1rem" };
    const style = { fontSize: sizes[level], fontWeight: 700 as const, margin: "0 0 0.5rem" };
    if (!text) return <div className="skeleton-line" style={{ ...style, width: "60%" }} />;
    if (level === "h1") return <h1 style={style}>{text}</h1>;
    if (level === "h3") return <h3 style={style}>{text}</h3>;
    return <h2 style={style}>{text}</h2>;
  },

  ApartmentCard: ({ props, children }) => {
    const { dispatch } = useA2UIActions();
    const apartmentId = asString(props.apartmentId);

    const renderSlot = (id: string | undefined, fallback: React.ReactNode) =>
      id ? (children as any)(id) : fallback;

    const fireAction = (name: string) => {
      if (!apartmentId) return;
      dispatch({
        userAction: {
          name,
          surfaceId: "apartment-results",
          context: { apartmentId },
          timestamp: new Date().toISOString(),
        },
      });
    };

    return (
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          transition: "box-shadow 0.2s",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ width: "100%", aspectRatio: "16 / 10", overflow: "hidden", background: "#f1f5f9" }}>
          {renderSlot(
            props.imageId,
            <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />,
          )}
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
            {renderSlot(
              props.titleId,
              <div className="skeleton-line" style={{ width: "70%" }} />,
            )}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
            {renderSlot(
              props.subtitleId,
              <div className="skeleton-line" style={{ width: "40%" }} />,
            )}
          </div>
          <div>
            {renderSlot(
              props.priceRowId,
              <div className="skeleton-line" style={{ width: "55%" }} />,
            )}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
            {renderSlot(
              props.descriptionId,
              <>
                <div className="skeleton-line" style={{ width: "90%", marginBottom: 4 }} />
                <div className="skeleton-line" style={{ width: "75%" }} />
              </>,
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={() => fireAction("view_details")}
              disabled={!apartmentId}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #0f766e",
                background: "#0f766e",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: apartmentId ? "pointer" : "default",
                opacity: apartmentId ? 1 : 0.6,
              }}
            >
              View Details
            </button>
            <button
              onClick={() => fireAction("schedule_tour")}
              disabled={!apartmentId}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: apartmentId ? "pointer" : "default",
                opacity: apartmentId ? 1 : 0.6,
              }}
            >
              Schedule Tour
            </button>
          </div>
        </div>
      </div>
    );
  },

  Badge: ({ props }) => {
    const colors = {
      success: { bg: "#dcfce7", text: "#166534" },
      warning: { bg: "#fef9c3", text: "#854d0e" },
      info: { bg: "#dbeafe", text: "#1e40af" },
      neutral: { bg: "#f1f5f9", text: "#475569" },
    };
    const c = colors[props.variant ?? "neutral"];
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: 999,
          fontSize: "0.75rem",
          fontWeight: 600,
          background: c.bg,
          color: c.text,
        }}
      >
        {asString(props.text)}
      </span>
    );
  },

  DetailSection: ({ props, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 8, color: "#334155" }}>
        {asString(props.title)}
      </div>
      {(children as any)(props.child)}
    </div>
  ),

  TextBlock: ({ props }) => {
    const text = asString(props.text);
    if (!text) {
      return (
        <>
          <div className="skeleton-line" style={{ width: "90%", marginBottom: 4 }} />
          <div className="skeleton-line" style={{ width: "70%" }} />
        </>
      );
    }
    return (
      <p style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>
        {text}
      </p>
    );
  },

  ListItem: ({ props }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <span style={{ fontSize: "0.8rem" }}>{props.icon ?? "•"}</span>
      <span style={{ fontSize: "0.85rem", color: "#475569" }}>{asString(props.text)}</span>
    </div>
  ),

  Image: ({ props }) => {
    const url = asString(props.url);
    if (!url) {
      return <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />;
    }
    return (
      <img
        src={url}
        alt={props.alt ?? ""}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  },

  CardGrid: ({ props, children }) => {
    const minColumnWidth = props.minColumnWidth ?? 280;
    const gap = props.gap ?? 16;
    const maxColumns = props.maxColumns;

    const gridTemplateColumns = maxColumns
      ? `repeat(auto-fit, minmax(max(${minColumnWidth}px, calc(100% / ${maxColumns} - ${gap}px)), 1fr))`
      : `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`;

    const items = Array.isArray(props.children) ? props.children : [];

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns,
          gap: `${gap}px`,
          width: "100%",
        }}
      >
        {items.map((id, i) => (
          <div key={`${id}-${i}`} style={{ minWidth: 0 }}>
            {(children as any)(id)}
          </div>
        ))}
      </div>
    );
  },
};

export const apartmentCatalog = createCatalog(
  apartmentCatalogDefinitions,
  renderers,
  { catalogId: "apartment-finder-catalog", includeBasicCatalog: true }
);
// #endregion genui
