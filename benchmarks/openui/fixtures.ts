import { apartmentLibrary } from "../../openui-copilotkit/src/lib/catalog.tsx";
import { replayTree, type Node } from "../common/replay-tree.ts";
export function fixture(task: any, control = "valid") {
  const statements: string[] = []; let next = 0;
  function encode(n: Node): string {
    const id = `n${next++}`, children = n.children?.map(encode) ?? [];
    const component = apartmentLibrary.components[n.type] ?? apartmentLibrary.components.Heading;
    const args = Object.entries(component.props.shape).map(([key, schema]: [string, any]) => key === "children" ? `[${children.join(",")}]` : key === "action" ? (n.action ? `@${n.action.name}(${n.action.apartmentId ? JSON.stringify(n.action.apartmentId) : ""})` : "null") : JSON.stringify(n.props[key] ?? schema.safeParse(undefined).data ?? null));
    statements.push(`${id} = ${n.type}(${args.join(",")});`); return id;
  }
  const root = encode(replayTree(task, control));
  const raw = [`root = ${root};`, ...statements.reverse()].join("\n");
  return control === "truncated" ? raw.slice(0, Math.floor(raw.length * .6)) : raw;
}
