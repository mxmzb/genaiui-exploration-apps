import { apartments } from "./apartment-data";
import { apartmentLibrary } from "./catalog";
import { compositionRules } from "./ui-instructions";
export function getSystemPrompt(records = apartments, today = new Date().toISOString().slice(0, 10)) {
  return apartmentLibrary.prompt({ preamble: `Today: ${today}.\n${compositionRules}`, toolCalls: false, bindings: false, builtinFunctions: false }) + `\nDATA (the only source of facts; preserve the order requested):\n${JSON.stringify(records)}`;
}
