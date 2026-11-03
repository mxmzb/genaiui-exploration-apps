import { validateOperation } from "../../a2ui-copilotkit/node_modules/@copilotkit/shared/dist/index.mjs";
import { apartmentUI } from "../../a2ui-copilotkit/src/lib/catalog.tsx";
import type { Variant } from "../../a2ui-copilotkit/src/lib/variants.ts";
import { createRequire } from "node:module";

// Use the installed renderer's public parser, including its built-in recovery.
// Resolve through react-core so the evaluator cannot silently use another version.
const requireFromRenderer = createRequire(
  import.meta.resolve(
    "../../a2ui-copilotkit/node_modules/@copilotkit/react-core/dist/v2/generative-ui.mjs",
  ),
);
const { extractFenceOperations, prepareSurfaceOperations } =
  requireFromRenderer("@copilotkit/core");

export function validate(raw: string, variant: Variant) {
  const errors: string[] = [],
    strategyErrors: string[] = [];
  let operations: any[] = [];
  const formatErrors: string[] = [];
  let recovery: any = null;
  try {
    if (variant.transport === "tool") {
      const args = JSON.parse(raw);
      if (args.target !== "apartments") errors.push("Wrong surface target");
      if (!Array.isArray(args.operations))
        throw Error("Missing operations array");
      operations = args.operations;
    } else {
      const match = raw
        .trim()
        .match(/^```a2ui target=apartments\n([\s\S]*)\n```$/);
      if (!match) throw Error("Expected one complete page-targeted A2UI fence");
      for (const line of match[1].split("\n").filter((s) => s.trim())) {
        try {
          JSON.parse(line);
        } catch (e) {
          formatErrors.push(String(e));
        }
      }
      const extracted = extractFenceOperations(match[1]);
      recovery = {
        invalidLines: extracted.invalidLines,
        recovered: extracted.recovered,
        partialObject: extracted.partialObject,
      };
      operations = prepareSurfaceOperations({
        operations: extracted.operations,
        fallbackSurfaceId: "benchmark",
        catalogId: apartmentUI.id,
      }).operations;
    }
    const knownSurfaces = new Set<string>();
    for (const op of operations) {
      const result = validateOperation(op, {
        manifest: {
          catalogId: apartmentUI.id,
          components: apartmentUI.manifestComponents,
        },
        knownSurfaces,
        functions: {},
      } as any);
      if (!result.ok) errors.push(result.reason);
      if (op.createSurface) knownSurfaces.add(op.createSurface.surfaceId);
    }
    const first = operations[0]?.createSurface;
    if (!first) errors.push("First operation must create the surface");
    const rest = operations.slice(1);
    if (
      variant.generation === "batch" &&
      !(
        operations.length === 2 &&
        first?.components.length === 1 &&
        rest[0]?.updateComponents
      )
    )
      strategyErrors.push("Expected root/data then one component batch");
    if (
      variant.generation === "components" &&
      !(
        first?.components.length === 1 &&
        rest.length > 1 &&
        rest.every((o) => o.updateComponents?.components.length === 1)
      )
    )
      strategyErrors.push(
        "Expected one component per operation after root/data",
      );
    if (["records", "fields"].includes(variant.generation)) {
      const firstData = rest.findIndex((o) => o.updateDataModel);
      const setup = firstData < 0 ? rest : rest.slice(0, firstData);
      const updates = firstData < 0 ? [] : rest.slice(firstData).map((o) => o.updateDataModel).filter(Boolean);
      const components = [...(first?.components ?? []), ...setup.flatMap((o) => o.updateComponents?.components ?? [])];
      if (!Array.isArray(first?.dataModel?.apartments) || first.dataModel.apartments.length || components.length < 2 || !updates.length || setup.some((o) => !o.updateComponents))
        strategyErrors.push("Expected complete template and empty array before data");
      if (firstData >= 0 && rest.slice(firstData).some((o) => !o.updateDataModel))
        strategyErrors.push("Expected only data updates after template");
      const ids = new Set(components.map((c) => c.id));
      for (const c of components) {
        const children = c.children;
        const references = Array.isArray(children) ? children : children?.componentId ? [children.componentId] : [];
        if (references.some((id: string) => !ids.has(id))) strategyErrors.push("Template references undefined children before data");
      }
      if (
        variant.generation === "records" &&
        updates.some(
          (u) =>
            !/^\/apartments\/\d+$/.test(u.path) ||
            !u.value?.title ||
            !u.value?.costs,
        )
      )
        strategyErrors.push(
          "Expected one complete apartment per indexed update",
        );
      if (variant.generation === "fields") {
        const seeds = updates.filter((u) => /^\/apartments\/\d+$/.test(u.path));
        if (
          !seeds.length ||
          seeds.some(
            (u) =>
              !u.value?.id ||
              !u.value?.costs ||
              Object.keys(u.value).some((k) => !["id", "costs"].includes(k)),
          ) ||
          updates.length <= seeds.length
        )
          strategyErrors.push(
            "Expected id/costs seeds followed by separate fields",
          );
        let last = -1;
        for (const u of updates) {
          const match = u.path.match(/^\/apartments\/(\d+)(\/[^/]+)?$/);
          if (!match || +match[1] < last)
            strategyErrors.push("Fields must complete each record in order");
          if (match) last = +match[1];
        }
      }
    }
  } catch (error) {
    errors.push(String(error));
    formatErrors.push(String(error));
  }
  return {
    operations,
    rawFormat: { pass: formatErrors.length === 0, errors: formatErrors },
    recovery,
    contract: { pass: errors.length === 0, errors },
    strategy: {
      pass: strategyErrors.length === 0 && operations.length > 0,
      errors: strategyErrors,
    },
  };
}
