import { apartments } from "./apartment-data";
import { compositionRules } from "./ui-instructions";
export function getSystemPrompt(records = apartments, today = new Date().toISOString().slice(0, 10)) {
  return `Today: ${today}.\n${compositionRules}\nDATA (the only source of facts):\n${JSON.stringify(records)}`;
}
