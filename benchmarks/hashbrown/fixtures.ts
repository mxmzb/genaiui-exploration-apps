import { replayTree, type Node } from "../common/replay-tree.ts";
const defaults: Record<string, object> = {
  Stack: { gap: "md", padding: "none", visible: true }, Row: { gap: "md", align: "start" }, Grid: { columns: "2", gap: "md" },
  Card: { recordId: "", variant: "outlined", padding: "none" }, Heading: { level: "h3" }, Text: { tone: "default" },
  Image: { aspect: "landscape" }, Badge: { tone: "neutral" }, Metric: { format: "text", emphasis: false },
  Button: { type: "button", variant: "primary", action: null },
};
export function fixture(task: any, control = "valid") {
  function encode(n: Node): any {
    return { [n.type]: { props: { ...defaults[n.type], ...n.props, ...(n.action ? { action: n.action } : {}) }, ...(n.children ? { children: n.children.map(encode) } : {}) } };
  }
  const raw = JSON.stringify({ ui: [encode(replayTree(task, control))] });
  return control === "truncated" ? raw.slice(0, Math.floor(raw.length * .6)) : raw;
}
