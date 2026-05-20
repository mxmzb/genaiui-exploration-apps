import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { getGenerateUiPrompt } from "../src/lib/catalog";

const __dirname = dirname(fileURLToPath(import.meta.url));

const prompt = getGenerateUiPrompt();

const outPath = resolve(__dirname, "..", "agent", "src", "generated", "system-prompt.txt");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, prompt, "utf-8");
console.log(`Generated ${outPath} (${prompt.length} chars)`);
