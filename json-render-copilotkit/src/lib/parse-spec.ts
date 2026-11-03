// #region genui - Apply JSONL patches, repairing recoverable model syntax before rendering.
import {
  parseSpecStreamLine,
  applySpecPatch,
  type Spec,
} from "@json-render/core";
import { jsonrepair } from "jsonrepair";

export function parseSpec(content: string, repair = true): Spec | null {
  let spec: Spec = { root: "", elements: {} };
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    let patch = parseSpecStreamLine(trimmed);
    if (repair && !patch && trimmed.startsWith("{")) {
      try {
        patch = parseSpecStreamLine(jsonrepair(trimmed));
      } catch {
        // Unrepairable lines cannot contribute a patch.
      }
    }
    if (patch && typeof patch.path === "string")
      spec = applySpecPatch(spec, patch);
  }
  return spec.root ? spec : null;
}
// #endregion genui
