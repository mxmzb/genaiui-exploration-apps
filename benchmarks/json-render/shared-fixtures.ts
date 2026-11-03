import { replayTree, type Node } from "../common/replay-tree.ts";
export function fixture(task: any, control = "valid") {
  const elements: Record<string, any> = {}; let next = 0;
  function encode(n: Node): string {
    const id = `n${next++}`;
    elements[id] = { type: n.type, props: n.props, ...(n.action ? { on: { press: { action: n.action.name, params: n.action.apartmentId ? { apartmentId: n.action.apartmentId } : {} } } } : {}) };
    if(n.children) elements[id].children = n.children.map(encode);
    return id;
  }
  const root = encode(replayTree(task, control));
  const raw = [{ op: "add", path: "/root", value: root }, ...Object.entries(elements).map(([id,value]) => ({op: "add", path: `/elements/${id}`, value}))].map(p => JSON.stringify(p)).join("\n");
  return control === "truncated" ? raw.slice(0, Math.floor(raw.length * .6)) : raw;
}
