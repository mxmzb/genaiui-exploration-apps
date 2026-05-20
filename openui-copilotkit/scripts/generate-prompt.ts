import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { apartmentLibrary, openuiPromptOptions } from "../src/lib/apartment-library";
import { TOOL_SPECS } from "../src/lib/apartment-tools";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "agent", "src", "generated");
const outPath = join(outDir, "system-prompt.txt");

const prompt = apartmentLibrary.prompt({
  ...openuiPromptOptions,
  tools: TOOL_SPECS,
  additionalRules: [
    ...(openuiPromptOptions.additionalRules ?? []),
    'EVERY response MUST be valid OpenUI Lang code — never respond with plain text or markdown.',
    'Every Form() MUST include a buttons argument with at least one Button.',
    'Each apartment card MUST include an Image component with the apartment imageUrl, PLUS both "View Details" and "Schedule Tour" buttons.',
    'Use CardGrid([...cards]) for apartment listings instead of Stack(row, wrap).',
  ],
});

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, prompt, "utf-8");
console.log(`System prompt written to ${outPath} (${prompt.length} chars)`);
