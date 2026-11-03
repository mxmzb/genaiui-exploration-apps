export const transports = ["tool", "markdown"] as const;
export const generations = [
  "batch",
  "components",
  "records",
  "fields",
] as const;
export type Variant = {
  transport: (typeof transports)[number];
  generation: (typeof generations)[number];
};
export const defaultVariant: Variant = {
  transport: "tool",
  generation: "batch",
};
export const variantId = (v: Variant) => `${v.transport}-${v.generation}`;
export const variants = transports.flatMap((transport) =>
  generations.map((generation) => ({ transport, generation })),
);
export const generationLabels = {
  batch: "Batch",
  components: "Component by component",
  records: "Apartment by apartment",
  fields: "Field by field",
};
export const generationDescriptions = {
  batch: "Send the selected data together, then the component tree together.",
  components:
    "Send the selected data together, then build the layout one component at a time.",
  records:
    "Build one reusable layout first, then send each apartment separately.",
  fields:
    "Build the layout first, then fill each apartment's fields separately.",
};
export function parseVariant(value: Record<string, unknown>): Variant {
  return {
    transport: transports.includes(value.transport as Variant["transport"])
      ? (value.transport as Variant["transport"])
      : defaultVariant.transport,
    generation: generations.includes(value.generation as Variant["generation"])
      ? (value.generation as Variant["generation"])
      : defaultVariant.generation,
  };
}
export function variantInstructions(variant: Variant) {
  const transport =
    variant.transport === "tool"
      ? 'Call render_ui ONCE, with target="apartments" first and then an operations array containing the COMPLETE view. Separate operations in this ONE call stream independently. Do not wait for another turn. Do not write A2UI as prose.'
      : "Write the COMPLETE view as newline-separated A2UI v1.0 JSON operations inside ONE markdown fence starting with ```a2ui target=apartments and ending with ```. Do not call render_ui. No prose outside the fence.";
  const strategy = {
    batch:
      "Use exactly two operations for a new view: (1) createSurface with the selected dataModel and only the root component, referencing its children; (2) ONE updateComponents containing every remaining component. Do not split the data or components into further updates.",
    components:
      "First createSurface with the complete selected dataModel and only the root component. Then emit ONE updateComponents operation PER component, parents before children. Each parent must reference its children immediately. Do not bundle multiple components in an update.",
    records:
      "First createSurface with the COMPLETE component tree and an empty apartments array. Then send ONE updateDataModel per complete record at /apartments/0, /apartments/1, etc., in the requested order. Do not resend a growing array. Use a shared children template over /apartments for search AND comparison. For a single-object view, send its complete data object after the tree.",
    fields:
      "First createSurface with the COMPLETE component tree and an empty apartments array. Use a shared children template for search AND comparison. For EACH record, first update /apartments/N with {id, costs}; keep costs together because value:null at a leaf deletes the key. Then emit one updateDataModel per remaining top-level field at /apartments/N/title, /apartments/N/imageUrl, etc. Nested arrays/objects may stay together. Finish one record before starting the next. Do not send the whole record or a growing array. For a single-object view, group nullable costs first, then update individual fields. Undefined means still arriving; null means a genuinely unknown fact. Never invent placeholder facts.",
  }[variant.generation];
  return `TRANSPORT AND UPDATE STRATEGY (follow these instead of any generic streaming examples):\n${transport}\n${strategy}\nFor every strategy, every referenced child and required fact must be present by the end. The strategy changes delivery, not the required result.`;
}
