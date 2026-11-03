import Ajv from "ajv";
import { responseSchema } from "../../hashbrown-copilotkit/src/lib/catalog.ts";
const check = new Ajv({ allErrors: true, strict: false }).compile(responseSchema);
export function validate(raw: string) {
  let operations: any;
  const errors: string[] = [];
  try { operations = JSON.parse(raw); if (!check(operations)) errors.push(...(check.errors ?? []).map(e => `${e.instancePath} ${e.message}`)); }
  catch (e) { errors.push(String(e)); }
  const status = { pass: !errors.length, errors };
  return { operations, contract: status, rawFormat: status, strategy: { pass: true, errors: [] }, recovery: { applied: false } };
}
export function checkActionBindings(root: any, task: any) {
  const errors: string[] = [], actual: any[] = [];
  function walk(nodes: any, scope?: string) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) for (const [name, value] of Object.entries(node ?? {})) {
      const { props, children } = value as any;
      const id = name === "Card" && props?.recordId ? props.recordId : scope;
      if (name === "Button" && props?.type !== "submit" && props?.action) {
        const action = props.action; actual.push({ ...action, scope: id });
        if (["view_apartment", "schedule_tour"].includes(action.name) && action.apartmentId !== id) errors.push(`Action ${action.name}:${action.apartmentId} on card ${id}`);
      }
      if (name === "Form") actual.push({ name: "submit_tour", apartmentId: props?.apartmentId, scope: id });
      walk(children, id);
    }
  }
  walk(root?.ui);
  for (const name of task.case.expected.actions) {
    for (const id of name === "back_to_results" ? [undefined] : task.case.expected.listing_ids)
      if (actual.filter(a => a.name === name && a.apartmentId === id).length !== 1) errors.push(`Missing/duplicate ${name}:${id}`);
  }
  for (const a of actual) if (!task.case.expected.actions.includes(a.name)) errors.push(`Unexpected action: ${a.name}`);
  return { pass: !errors.length, errors, actual };
}
