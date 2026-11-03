import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { validate } from "./validate.ts";
import { checkActionBindings } from "./actions.ts";
import { variantId } from "../../a2ui-copilotkit/src/lib/variants.ts";

process.env.PROMPTFOO_DISABLE_TELEMETRY = "1";
process.env.PROMPTFOO_DISABLE_UPDATE = "1";
process.env.PROMPTFOO_CONFIG_DIR = resolve(".promptfoo");
const directory = resolve(process.argv[2]);
const manifest = JSON.parse(
  await readFile(resolve(directory, "manifest.json"), "utf8"),
);
const fixtureDirectory = manifest.fixtureDirectory ?? "v2";
for (const file of [`${fixtureDirectory}/dataset.json`, `${fixtureDirectory}/cases.json`]) {
  const digest = createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
  if (digest !== manifest.sourceFiles[file])
    throw Error(`Refusing to regrade with changed fixture: ${file}`);
}
const dataset = JSON.parse(await readFile(`${fixtureDirectory}/dataset.json`, "utf8"));
const cases = JSON.parse(await readFile(`${fixtureDirectory}/cases.json`, "utf8")).generation;
const records = await Promise.all(
  (await readdir(directory))
    .filter((f) => /^\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(async (file) => {
      const original = JSON.parse(
        await readFile(resolve(directory, file), "utf8"),
      );
      const task = {
        case: cases.find((c: any) => c.id === original.caseId),
        records: [] as any[],
      };
      task.records = task.case.input_ids.map((id: string) =>
        dataset.records.find((r: any) => r.id === id),
      );
      const parsed = validate(original.raw, original.variant);
      const verdicts = {
        ...original.verdicts,
        rawFormat: parsed.rawFormat,
        contract: parsed.contract,
        strategy: parsed.strategy,
        actionBindings: checkActionBindings(parsed.operations, task),
      };
      const automaticPass = Object.entries(verdicts)
        .filter(([k]) => k !== "rawFormat")
        .every(([, v]: any) => v.pass);
      return {
        file,
        id: original.id,
        caseId: original.caseId,
        variant: original.variant,
        control: original.control,
        originalPass: original.pass,
        automaticPass,
        pass: original.expectedFailure
          ? !verdicts[original.expectedFailure].pass
          : automaticPass,
        verdicts,
        recovery: parsed.recovery,
        timing: original.browser.metrics,
        originalGenerationCostUsd: original.costUsd,
      };
    }),
);
const providers = [...new Set(records.map((r) => variantId(r.variant)))].map(
  (id) => ({
    id: () => id,
    label: id,
    handlesOwnRetries: true,
    async callApi(_p: string, context: any) {
      return { output: JSON.stringify(records[context.vars.slot]), cost: 0 };
    },
  }),
);
const { default: promptfoo } = await import("promptfoo");
const evaluation = await promptfoo.evaluate(
  {
    writeLatestResults: true,
    description:
      "A2UI offline regrade: raw format vs native recovery (no model calls)",
    providers,
    prompts: ["{{caseId}}"],
    tests: records.map((r, i) => ({
      vars: { slot: i, caseId: r.caseId },
      providers: [variantId(r.variant)],
      assert: [
        {
          type: "javascript",
          value: (output: string) => JSON.parse(output).pass,
        },
      ],
    })),
  },
  { cache: false, maxConcurrency: 1, showProgressBar: false },
);
const review = resolve(directory, "reviewed");
await mkdir(review, { recursive: true });
const summary = {
  evalId: evaluation.id,
  source: directory,
  paidCalls: 0,
  paidCostUsd: 0,
  originalGenerationCostUsd: records.reduce(
    (n, r) => n + (r.originalGenerationCostUsd ?? 0),
    0,
  ),
  passed: records.filter((r) => r.pass).length,
  total: records.length,
  rawFormatPasses: records.filter((r) => r.verdicts.rawFormat.pass).length,
};
await writeFile(
  resolve(review, "trials.json"),
  JSON.stringify(records, null, 2),
);
await writeFile(
  resolve(review, "summary.json"),
  JSON.stringify(summary, null, 2),
);
await writeFile(
  resolve(review, "promptfoo.json"),
  JSON.stringify(await evaluation.toEvaluateSummary(), null, 2),
);
console.log(JSON.stringify(summary, null, 2));
