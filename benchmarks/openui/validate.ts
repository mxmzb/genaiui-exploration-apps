import { createParser, evaluateElementProps } from "../../openui-copilotkit/node_modules/@openuidev/lang-core/dist/index.mjs";
import { apartmentLibrary } from "../../openui-copilotkit/src/lib/catalog.tsx";
export function validate(raw: string) {
  const parsed = createParser(apartmentLibrary.toJSONSchema(), apartmentLibrary.root).parse(raw);
  const errors = [...parsed.meta.errors.map(e => JSON.stringify(e)), ...parsed.meta.unresolved.map(s => `Unresolved: ${s}`)];
  if (!parsed.root) errors.push("Missing root");
  if (parsed.meta.incomplete) errors.push("Incomplete program");
  const status = { pass: !errors.length, errors };
  return { parsed, operations: parsed.root, contract: status, rawFormat: status, strategy: { pass: true, errors: [] }, recovery: parsed.meta };
}
export function checkActionBindings(root: any, task: any) {
  const errors: string[] = [], actual: any[] = [];
  function walk(node: any, scope?: string) {
    if (Array.isArray(node)) { node.forEach(n => walk(n, scope)); return; }
    if (!node || typeof node !== "object") return;
    if (node.type !== "element") return;
    const props: any = evaluateElementProps(node, { ctx: { getState: () => undefined, resolveRef: () => undefined, actions: apartmentLibrary.toJSONSchema().actions }, library: apartmentLibrary, store: null }).props;
    if (node.typeName === "Card" && props.recordId) scope = props.recordId;
    if (node.typeName === "Button" && props.type !== "submit") {
      const plan = props.action;
      const steps = plan?.steps ?? (plan ? [plan] : []);
      for (const step of steps) {
        const name = step.name ?? step.type;
        const id = step.params?.apartmentId;
        actual.push({ name, apartmentId: id, scope });
        if (["view_apartment", "schedule_tour"].includes(name) && id !== scope) errors.push(`Action ${name}:${id} on card ${scope}`);
      }
    }
    if (node.typeName === "Form") actual.push({ name: "submit_tour", apartmentId: props.apartmentId, scope });
    walk(props.children, scope);
  }
  walk(root);
  for (const name of task.case.expected.actions) {
    const ids = name === "back_to_results" ? [undefined] : task.case.expected.listing_ids;
    for (const id of ids) if (actual.filter(a => a.name === name && a.apartmentId === id).length !== 1) errors.push(`Missing/duplicate ${name}:${id}`);
  }
  for (const a of actual) if (!task.case.expected.actions.includes(a.name)) errors.push(`Unexpected action: ${a.name}`);
  return { pass: !errors.length, errors, actual };
}
