import { applySpecPatch, validateSpec, resolveElementProps, resolveActionParam, resolveRepeatStatePath, getByPath } from "../../json-render-standalone/node_modules/@json-render/core/dist/index.mjs";
import { catalog } from "../../json-render-standalone/src/lib/catalog.ts";

export function validateOutput(raw: string) {
  const formatErrors: string[] = [];
  const contractErrors: string[] = [];
  const spec: any = { root: "", elements: {} };
  let patches = 0;
  for (const [index, line] of raw.split("\n").entries()) {
    if (!line.trim()) continue;
    try {
      const patch = JSON.parse(line);
      if (!["add", "replace", "remove", "move", "copy", "test"].includes(patch.op) || typeof patch.path !== "string") throw new Error("not a JSON Patch operation");
      applySpecPatch(spec, patch);
      patches++;
    } catch (error) { formatErrors.push(`line ${index + 1}: ${String(error)}`); }
  }
  if (!patches) formatErrors.push("no patches");
  try {
    contractErrors.push(...validateSpec(spec, { checkOrphans: true }).issues.map((i: any) => i.message));
    let count = 0;
    function visit(id: string, ctx: any, parents: string[]) {
      if (++count > 5000 || parents.includes(id)) throw new Error("cyclic or oversized component tree");
      const element = spec.elements[id];
      if (!element) throw new Error(`missing element ${id}`);
      const component = (catalog.data.components as any)[element.type];
      if (!component) throw new Error(`unknown component ${element.type}`);
      const props = resolveElementProps(element.props ?? {}, ctx);
      const result = component.props.safeParse(props);
      if (!result.success) contractErrors.push(`${id}: ${result.error.message}`);
      for (const [event, value] of Object.entries(element.on ?? {})) {
        if (event !== "press" || element.type !== "Button") contractErrors.push(`${id}: unsupported event ${event}`);
        for (const binding of Array.isArray(value) ? value : [value]) {
          const action = (catalog.data.actions as any)[binding.action];
          if (!action) { contractErrors.push(`${id}: unknown action ${binding.action}`); continue; }
          const params = resolveActionParam(binding.params ?? {}, ctx);
          if (!action.params.safeParse(params).success) contractErrors.push(`${id}: invalid action parameters`);
        }
      }
      const children = element.children ?? [];
      if (element.repeat) {
        const path = resolveRepeatStatePath(element.repeat.statePath, ctx.repeatBasePath);
        if (!path) throw new Error(`${id}: unresolved repeat path`);
        const items = getByPath(spec.state ?? {}, path);
        if (!Array.isArray(items)) throw new Error(`${id}: repeat source is not an array`);
        items.forEach((item: any, i: number) => children.forEach((child: string) => visit(child, { ...ctx, repeatItem: item, repeatIndex: i, repeatBasePath: `${path}/${i}` }, [...parents, id])));
      } else children.forEach((child: string) => visit(child, ctx, [...parents, id]));
    }
    visit(spec.root, { stateModel: spec.state ?? {} }, []);
  } catch (error) { contractErrors.push(String(error)); }
  return { rawFormat: { pass: formatErrors.length === 0, errors: formatErrors }, contract: { pass: contractErrors.length === 0, errors: contractErrors }, spec };
}

export function checkActions(test: any, clicks: any[]) {
  const errors: string[] = [];
  for (const click of clicks) {
    if (click.events.length !== 1) { errors.push(`${click.label}: expected one action, received ${click.events.length}`); continue; }
    const event = click.events[0];
    if (["view_apartment", "schedule_tour"].includes(event.name) && event.params?.apartmentId !== click.scopeId) errors.push(`${click.label}: targets ${event.params?.apartmentId} from record ${click.scopeId}`);
  }
  for (const name of test.expected.actions) {
    const ids = name === "back_to_results" ? [null] : test.expected.listing_ids;
    for (const id of ids) if (!clicks.some((c) => c.events.some((e: any) => e.name === name && (id === null || e.params?.apartmentId === id)))) errors.push(`missing working ${name} for ${id ?? "view"}`);
  }
  return { pass: errors.length === 0, errors };
}
