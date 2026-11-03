import { apartments } from "./apartment-data";
import { compositionRules } from "./ui-instructions";
import { defaultVariant, variantInstructions, type Variant } from "./variants";

export function getSystemPrompt(
  variant: Variant = defaultVariant,
  records = apartments,
  today = new Date().toISOString().slice(0, 10),
) {
  return `Today: ${today}.
${compositionRules}
${variantInstructions(variant)}
DATA (the only source of listing facts; preserve any order explicitly requested by the task):
${JSON.stringify(records)}`;
}
