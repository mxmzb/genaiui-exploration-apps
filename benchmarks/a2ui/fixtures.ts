import { replayTree, type Node } from "../common/replay-tree.ts";
import { apartmentUI } from "../../a2ui-copilotkit/src/lib/catalog.tsx";
import type { Variant } from "../../a2ui-copilotkit/src/lib/variants.ts";

// One final tree/data model; only operation boundaries change between strategies.
export function fixture(task: any, variant: Variant, control = "valid") {
  if (!["C02", "C03"].includes(task.case.id) || ["dead-action", "wrong-fee", "unexpected-action", "hallucinated-record", "missing-required", "wrong-form-target"].includes(control)) return literalFixture(task, variant, control);
  const records = task.records.map((r: any) => ({
    id: r.id,
    costs: r.costs,
    title: r.title,
    neighborhood: r.neighborhood,
    imageUrl: r.imageUrl,
    rent: control === "wrong-price" ? 1 : r.rent,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    sqft: r.sqft,
    ...(task.case.id === "C02"
      ? {
          mandatoryFees: r.fees
            .filter((f: any) => f.required && f.frequency === "monthly")
            .map(
              (f: any) =>
                `${f.label}: ${f.amount === null ? "Unknown" : "$" + f.amount}`,
            )
            .join("; "),
          petPolicy: r.petPolicy,
          petLimit:
            r.petRules.maxWeightLbs === null
              ? "No supplied weight limit"
              : `${r.petRules.maxWeightLbs} lb weight limit`,
          transit: r.transit
            .map((t: any) => `${t.name}: ${t.walkMinutes} minutes`)
            .join("; "),
        }
      : {}),
  }));
  const path = (p: string) => ({ "@path": p });
  const node = (id: string, component: string, props: any = {}) => ({
    id,
    component,
    ...props,
  });
  const root = node("root", "Stack", {
    padding: "none",
    children: ["heading", "grid"],
  });
  const nodes = [
    root,
    node("heading", "Heading", {
      text:
        task.case.id === "C02"
          ? "Compare apartments"
          : "Apartments sorted by rent",
      level: "h2",
    }),
    node("grid", "Grid", {
      columns: task.case.id === "C02" ? "3" : "1",
      children: { componentId: "listing", path: "/apartments" },
    }),
    node("listing", "Card", { recordId: path("id"), children: ["layout"] }),
    node("layout", "Grid", {
      columns: "2",
      gap: "sm",
      children: ["photo", "body"],
    }),
    node("photo", "Image", {
      src: path("imageUrl"),
      alt: "Illustrative apartment photo",
    }),
    node("body", "Stack", {
      padding: "md",
      children: [
        "area-badge",
        "title",
        "total",
        "unknown",
        "rent",
        "stats",
        ...(task.case.id === "C02"
          ? ["fees", "pet-policy", "pet-limit", "transit"]
          : []),
        "actions",
      ],
    }),
    node("area-badge", "Badge", { text: path("neighborhood") }),
    node("title", "Heading", { text: path("title"), level: "h3" }),
    node("total", "Metric", {
      label: "Monthly total",
      value: path("costs/monthlyTotal"),
      format: "usd/month",
    }),
    node("unknown", "Stack", {
      visible: {
        "@call": "not",
        args: {
          value: {
            "@call": "required",
            args: { value: path("costs/monthlyTotal") },
          },
        },
      },
      children: ["subtotal", "fee-note"],
    }),
    node("subtotal", "Metric", {
      label: "Known monthly subtotal",
      value: path("costs/knownMonthlySubtotal"),
      format: "usd/month",
    }),
    node("fee-note", "Text", {
      content: "Mandatory fees are unknown; this subtotal is incomplete.",
    }),
    node("rent", "Metric", {
      label: "Base rent",
      value: path("rent"),
      format: "usd/month",
    }),
    node("stats", "Row", { children: ["beds", "baths", "area"] }),
    node("beds", "Metric", { label: "Bedrooms", value: path("bedrooms") }),
    node("baths", "Metric", { label: "Bathrooms", value: path("bathrooms") }),
    node("area", "Metric", {
      label: "Area",
      value: path("sqft"),
      format: "sqft",
    }),
    node("actions", "Row", { children: ["details", "tour"] }),
    node("details", "Button", {
      label: "View Details",
      onClick: {
        event: { name: "view_apartment", context: { apartmentId: path("id") } },
      },
    }),
    node("tour", "Button", {
      label: "Schedule Tour",
      onClick: {
        event: { name: "schedule_tour", context: { apartmentId: path("id") } },
      },
    }),
  ];

  if (task.case.id === "C02") {
    nodes.push(
      node("fees", "Text", { content: path("mandatoryFees") }),
      node("pet-policy", "Text", { content: path("petPolicy") }),
      node("pet-limit", "Text", { content: path("petLimit") }),
      node("transit", "Text", { content: path("transit") }),
    );
    root.children.push("back");
    nodes.push(
      node("back", "Button", {
        label: "Back to Results",
        onClick: { event: { name: "back_to_results", context: {} } },
      }),
    );
  }
  if (control === "wrong-action")
    (
      nodes.find((n) => n.id === "details") as any
    ).onClick.event.context.apartmentId = "999";
  if (control === "missing-field") records.forEach((r: any) => delete r.rent);
  if (control === "invalid-component") nodes[1].component = "InventedWidget";
  const sid = "results";
  const create = (components: any[], apartments: any[]) => ({
    version: "v1.0",
    createSurface: {
      surfaceId: sid,
      catalogId: apartmentUI.id,
      components,
      dataModel: { apartments },
    },
  });
  const components = (items: any[]) => ({
    version: "v1.0",
    updateComponents: { surfaceId: sid, components: items },
  });
  const data = (p: string, value: any) => ({
    version: "v1.0",
    updateDataModel: { surfaceId: sid, path: p, value },
  });
  const operations = {
    batch: () => [create([root], records), components(nodes.slice(1))],
    components: () => [
      create([root], records),
      ...nodes.slice(1).map((n) => components([n])),
    ],
    records: () => [
      create(nodes, []),
      ...records.map((r: any, i: number) => data(`/apartments/${i}`, r)),
    ],
    fields: () => [
      create(nodes, []),
      ...records.flatMap((r: any, i: number) => [
        data(`/apartments/${i}`, { id: r.id, costs: r.costs }),
        ...Object.entries(r)
          .filter(([k]) => !["id", "costs"].includes(k))
          .map(([key, value]) => data(`/apartments/${i}/${key}`, value)),
      ]),
    ],
  }[variant.generation]();
  let raw =
    variant.transport === "tool"
      ? JSON.stringify({ target: "apartments", operations })
      : "```a2ui target=apartments\n" +
        operations.map((o) => JSON.stringify(o)).join("\n") +
        "\n```";
  if (control === "truncated") raw = raw.slice(0, Math.floor(raw.length * 0.7));
  return { raw, operations };
}

// The shared six-case baseline uses batch transport variants for these views.
// The runner restricts record/field strategy comparisons to C02/C03 above.
function literalFixture(task: any, variant: Variant, control: string) {
  const nodes: any[] = []; let next = 0;
  function encode(n: Node, id = `n${next++}`): string {
    const node: any = { id, component: n.type, ...n.props }; nodes.push(node);
    if (n.action) node.onClick = { event: { name: n.action.name, context: n.action.apartmentId ? { apartmentId: n.action.apartmentId } : {} } };
    if (n.type === "Form") node.onSubmit = { event: { name: "submit_tour" } };
    if (n.children) node.children = n.children.map(child => encode(child));
    return id;
  }
  encode(replayTree(task, control), "root");
  const create = { version: "v1.0", createSurface: { surfaceId: "results", catalogId: apartmentUI.id, components: variant.generation === "records" || variant.generation === "fields" ? nodes : nodes.slice(0,1), dataModel: {} } };
  const operations = [create, ...(["records", "fields"].includes(variant.generation) ? [] : variant.generation === "batch" ? [{ version: "v1.0", updateComponents: { surfaceId: "results", components: nodes.slice(1) } }] : nodes.slice(1).map(n => ({ version: "v1.0", updateComponents: { surfaceId: "results", components: [n] } })))];
  let raw = variant.transport === "tool" ? JSON.stringify({ target: "apartments", operations }) : "```a2ui target=apartments\n" + operations.map(o => JSON.stringify(o)).join("\n") + "\n```";
  if(control === "truncated") raw = raw.slice(0, Math.floor(raw.length * .6));
  return { raw, operations };
}
