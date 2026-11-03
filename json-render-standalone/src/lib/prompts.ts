// #region genui - Keep data on the server; the same compositional rules serve chat and workspace views.
import { catalog } from "./catalog";
import { apartments } from "./apartment-data";
import { compositionRules } from "./ui-instructions";

export function getSystemPrompt(
  surface = false,
  records = apartments.toSorted((a, b) => a.rent - b.rent || Number(a.id) - Number(b.id)),
  date = new Date().toISOString().slice(0, 10),
): string {
  return catalog.prompt({
    mode: "standalone",
    customRules: [compositionRules],
    system: `Today: ${date}.
${surface ? "Replace the persistent workspace." : "Render this conversation turn."}
DATA (the only source of listing facts; preserve the supplied order unless the request specifies another order):
${JSON.stringify(records)}`,
  });
}
// #endregion genui
