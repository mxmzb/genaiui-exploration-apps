import { createServer } from "node:http";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { resolve, extname, relative } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import { generateUI } from "../../json-render-standalone/src/lib/generate-ui.ts";
import { getSystemPrompt } from "../../json-render-standalone/src/lib/prompts.ts";
import { Budget, reserveCost } from "./budget.ts";
import { transport } from "./transport.ts";
import { observeTrial } from "./browser.ts";
import { validateOutput } from "./validate.ts";

process.env.PROMPTFOO_DISABLE_TELEMETRY = "1";
process.env.PROMPTFOO_DISABLE_UPDATE = "1";
process.env.PROMPTFOO_CONFIG_DIR = resolve(".promptfoo");
const { values } = parseArgs({ options: {
  mode: { type: "string", default: "plan" },
  "max-spend-usd": { type: "string" },
  repetitions: { type: "string", default: "3" },
} });
if (!["plan", "fixture", "live"].includes(values.mode!)) throw new Error("Use --mode plan|fixture|live");
const live = values.mode === "live";
const controls = values.mode === "fixture";
const repetitions = Number(values.repetitions);
if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 30) throw new Error("Invalid repetition count");
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const json = async (path: string) => JSON.parse(await readFile(path, "utf8"));
const dataset = await json("v3/dataset.json");
const casesFile = await json("v3/cases.json");
const tasks = casesFile.generation.filter((c: any) => ["C01", "C02", "C04"].includes(c.id)).map((c: any) => ({
  case: c,
  records: c.input_ids.map((id: string) => dataset.records.find((r: any) => r.id === id)),
  otherRecords: dataset.records.filter((r: any) => !c.input_ids.includes(r.id)),
}));
const prompts = Object.fromEntries(tasks.map((t: any) => [t.case.id, getSystemPrompt(true, t.records, "2026-11-02")]));
const candidates = [
  { id: "openai/gpt-4.1", providerTag: "azure/swedencentral", providerName: "Azure", zdr: true, temperature: 0.3, maxCompletionParameter: true },
  { id: "google/gemini-3.8-flash", providerTag: "google-vertex/us", providerName: "Google", zdr: true, temperature: null, reasoning: { effort: "low" } },
];
const models: any[] = controls ? [{ id: "fixture", providerTag: "fixture", providerName: "fixture", pricing: { prompt: "0", completion: "0" } }] : await Promise.all(candidates.map(async (model) => {
  const response = await fetch(`https://openrouter.ai/api/v1/models/${model.id}/endpoints`);
  if (!response.ok) throw new Error(`Cannot price ${model.id}: HTTP ${response.status}`);
  const data: any = await response.json();
  const endpoint = data.data.endpoints.find((e: any) => e.tag === model.providerTag);
  if (!endpoint) throw new Error(`Pinned provider unavailable for ${model.id}`);
  return { ...model, pricing: endpoint.pricing, endpoint };
}));
const reservation = (model: any, task: any) => reserveCost(Buffer.byteLength(prompts[task.case.id] + task.case.prompt), 12000, model.pricing);
const ceiling = models.reduce((total, model) => total + tasks.reduce((n: number, task: any) => n + reservation(model, task) * repetitions, 0), 0);
const plan = { mode: values.mode, trials: controls ? 6 : tasks.length * models.length * repetitions, repetitions, maxOutputTokens: 12000, generationTimeoutMs: 120000, retries: 0, estimatedWorstCaseUsd: ceiling, spendCapUsd: live ? Number(values["max-spend-usd"]) : null, pricesPerToken: models.map((m) => ({ model: m.id, provider: m.providerTag, temperature: m.temperature ?? null, reasoning: m.reasoning ?? null, pricing: m.pricing })) };
console.log(JSON.stringify(plan, null, 2));
if (values.mode === "plan") process.exit(0);
const budget = live ? new Budget(Number(values["max-spend-usd"])) : null;
if (live && !process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is missing; no paid calls started");
if (live && budget!.maximum < ceiling) throw new Error("Cap is below the planned conservative ceiling; no paid calls started");
const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${values.mode}`;
const out = resolve("results", runId);
await mkdir(out, { recursive: true });
// A source hash must describe the bundle actually observed, never a stale build.
execFileSync(process.execPath, [resolve("../json-render-standalone/node_modules/vite/bin/vite.js"), "build", "--config", resolve("json-render/vite.config.ts")], { stdio: "pipe" });
const save = (name: string, value: any) => writeFile(resolve(out, name), JSON.stringify(value, null, 2));
const sourceFiles: Record<string, string> = {};
async function fingerprint(path: string) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (["dist", "node_modules", "results"].includes(entry.name)) continue;
    const file = resolve(path, entry.name);
    if (entry.isDirectory()) await fingerprint(file);
    else sourceFiles[relative(resolve(".."), file)] = hash(await readFile(file));
  }
}
await fingerprint("../json-render-standalone/src");
await fingerprint("../json-render-standalone/patches");
await fingerprint("json-render");
await fingerprint("json-render/dist");
for (const file of ["package.json", "pnpm-lock.yaml", "../json-render-standalone/package.json", "../json-render-standalone/pnpm-lock.yaml", "../json-render-standalone/pnpm-workspace.yaml"]) sourceFiles[relative(resolve(".."), resolve(file))] = hash(await readFile(file));
const browser = await chromium.launch({ headless: true });
const manifest = {
  runId, createdAt: new Date().toISOString(), experiment: "A", plan, models,
  framework: { name: "json-render", version: "0.21.4", localStreamingPatch: "patches/@json-render__react@0.21.4.patch", upstream: "https://github.com/vercel-labs/json-render/pull/447" },
  gitCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  gitStatus: execFileSync("git", ["status", "--short"], { encoding: "utf8" }),
  sourceFiles, sourceHash: hash(JSON.stringify(sourceFiles)),
  fixtureRevision: 3,
  datasetHash: hash(await readFile("v3/dataset.json")), casesHash: hash(await readFile("v3/cases.json")),
  promptHashes: Object.fromEntries(Object.entries(prompts).map(([id, prompt]) => [id, hash(prompt as string)])),
  environment: { node: process.version, os: `${os.platform()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0].model, memoryBytes: os.totalmem(), chromium: browser.version(), viewport: "1280x900", date: casesFile.clock, locale: "en-US", timeZone: "UTC" },
  cache: "No response cache. Fresh browser context per trial; page assets loaded before timing. Provider prompt caching is reported in usage.",
  images: "Every images.unsplash.com URL is served from json-render/image.svg, keeping the requested URL. No CDN or photo-decoding latency. External Google fonts blocked uniformly.",
  review: "Automated content checks are conservative and incomplete for prose. Human review is required; this is an instrumentation pilot, not a ranking.",
  orderSeed: 20261101,
};
await save("manifest.json", manifest);
let current: any;
const server = createServer(async (req, res) => {
  try {
    if (req.url === "/api/surface" && req.method === "POST") {
      if (!current) throw new Error("No active trial");
      const trial = current;
      let body = ""; for await (const chunk of req) body += chunk;
      if (trial.invoked) {
        trial.actionRequests.push(JSON.parse(body).messages.at(-1));
        res.writeHead(200, { "content-type": "text/plain" }); res.end(); return;
      }
      trial.invoked = true;
      const abort = new AbortController();
      res.on("close", () => { if (!res.writableEnded) abort.abort(); });
      const response = await generateUI(new Request(`http://localhost/api/surface`, { method: "POST", body, signal: abort.signal }), true, {
        model: trial.model.id, baseURL: "https://openrouter.ai/api/v1", apiKey: controls ? "fixture-not-a-key" : process.env.OPENROUTER_API_KEY,
        systemPrompt: prompts[trial.task.case.id], fetch: transport(trial, trial.model, controls ? trial.control : undefined),
        onFinish: (result: any) => { trial.sdkUsage = result.totalUsage; trial.sdkFinishReason = result.finishReason; },
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) for await (const chunk of response.body) res.write(chunk);
      res.end(); return;
    }
    const path = req.url === "/" ? "index.html" : decodeURIComponent(req.url!.split("?")[0]).replace(/^\//, "");
    const file = resolve("json-render/dist", path);
    if (!file.startsWith(resolve("json-render/dist") + "/")) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": ({ ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml" } as any)[extname(file)] ?? "application/octet-stream" });
    res.end(await readFile(file));
  } catch (error) { if (!res.headersSent) res.writeHead(500); res.destroy(error as Error); }
});
await new Promise<void>((ready) => server.listen(0, "127.0.0.1", ready));
const baseURL = `http://127.0.0.1:${(server.address() as any).port}`;
const trials: any[] = [];
let fatal: string | undefined;
const providers = models.map((model) => ({
  id: () => model.id, label: model.id, handlesOwnRetries: true,
  async callApi(_prompt: string, context: any) {
    if (fatal) return { error: fatal };
    const task = tasks.find((t: any) => t.case.id === context.vars.caseId);
    const id = `${String(trials.length + 1).padStart(2, "0")}-${task.case.id}-${model.id.replaceAll("/", "-")}`;
    const directory = resolve(out, id); await mkdir(directory);
    const reserved = reservation(model, task);
    try { budget?.reserve(reserved); } catch (error) { fatal = String(error); return { error: fatal }; }
    const trial: any = { id, runId, experiment: "A", caseId: task.case.id, repetition: context.vars.repetition, control: context.vars.control, task, model, startedAt: new Date().toISOString(), inputHash: hash(prompts[task.case.id] + task.case.prompt), reservedUsd: reserved, actionRequests: [], retryCount: 0 };
    current = trial;
    await observeTrial(browser, baseURL, trial, directory);
    await trial.capture;
    if (live && [400, 401, 402, 403, 404].includes(trial.httpStatus)) fatal = `Configuration failure: HTTP ${trial.httpStatus}; ${JSON.stringify(trial.providerError)}`;
    trial.costUsd = typeof trial.usage?.cost === "number" ? trial.usage.cost : null;
    trial.uncachedListEstimateUsd = trial.usage ? trial.usage.prompt_tokens * Number(model.pricing.prompt) + trial.usage.completion_tokens * Number(model.pricing.completion) : null;
    if (live && trial.generationId) {
      try {
        const response = await fetch(`https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(trial.generationId)}`, { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }, signal: AbortSignal.timeout(10000) });
        if (response.ok) {
          trial.generation = (await response.json() as any).data;
          trial.servingProvider ??= trial.generation.provider_name;
          trial.costUsd ??= trial.generation.total_cost ?? null;
        } else trial.generationLookupStatus = response.status;
      } catch { trial.generationLookupStatus = "unavailable"; }
    }
    try { budget?.settle(reserved, trial.costUsd); } catch (error) { fatal = String(error); }
    const parsed = validateOutput(trial.raw ?? "");
    const routePass = trial.request?.model === model.id && trial.servingProvider === model.providerName && (trial.returnedModel === model.id || trial.returnedModel?.startsWith(model.id + "-"));
    if (live && trial.httpStatus === 200 && !routePass) fatal = "The returned model/provider could not be verified; stop before another paid call";
    const verdicts = {
      rawFormat: parsed.rawFormat,
      contract: parsed.contract,
      content: { pass: !!trial.dom && trial.dom.errors.length === 0, errors: trial.dom?.errors ?? ["No final DOM"] },
      actions: trial.actions,
      route: { pass: routePass, errors: routePass ? [] : [`requested=${trial.request?.model}, returned=${trial.returnedModel}, provider=${trial.servingProvider}`] },
      runtime: { pass: !trial.browserError && !trial.captureError && !trial.providerError && trial.browser?.httpStatus === 200 && !trial.browser?.streamError && trial.browserErrors.length === 0, errors: [trial.browserError, trial.captureError, trial.providerError && JSON.stringify(trial.providerError), trial.httpStatus !== 200 && `Provider HTTP ${trial.httpStatus}`, ...trial.browserErrors].filter(Boolean).map(String) },
    };
    trial.verdicts = verdicts;
    trial.automaticPass = Object.entries(verdicts).filter(([name]) => name !== "rawFormat").every(([, v]: any) => v.pass);
    trial.manualReview = "pending";
    if (!trial.automaticPass && trial.browser) trial.browser.usable = null;
    trial.sourceHash = manifest.sourceHash;
    trial.datasetHash = manifest.datasetHash;
    trial.promptHash = manifest.promptHashes[task.case.id];
    trial.artifacts = { screenshot: `${id}/final.png`, trace: `${id}/trace.zip`, raw: `${id}/response.jsonl`, spec: `${id}/spec.json`, html: `${id}/final.html` };
    await writeFile(`${directory}/response.jsonl`, trial.raw ?? "");
    await writeFile(`${directory}/spec.json`, JSON.stringify(parsed.spec, null, 2));
    await writeFile(`${directory}/final.html`, trial.finalHTML ?? "");
    delete trial.capture; delete trial.callStarted; delete trial.finalHTML;
    await writeFile(`${directory}/trial.json`, JSON.stringify(trial, null, 2));
    trials.push(trial);
    console.log(`${id}: ${trial.automaticPass ? "PASS" : "FAIL"}; $${trial.costUsd ?? "unknown"}; ${Object.entries(verdicts).filter(([, v]: any) => !v.pass).map(([name]) => name).join(", ")}`);
    return { output: trial.raw ?? "", cached: false, ...(trial.costUsd !== null ? { cost: trial.costUsd } : {}), tokenUsage: trial.usage ? { prompt: trial.usage.prompt_tokens, completion: trial.usage.completion_tokens, total: trial.usage.total_tokens } : undefined, metadata: { trialId: id, verdicts, automaticPass: trial.automaticPass, browser: trial.browser, artifacts: trial.artifacts } };
  },
}));
// Materialize randomized balanced repetitions as Promptfoo cases, preserving the order in the export.
let seed = manifest.orderSeed;
const shuffle = (rows: any[]) => {
  for (let i = rows.length - 1; i > 0; i--) { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; const j = seed % (i + 1); [rows[i], rows[j]] = [rows[j], rows[i]]; }
  return rows;
};
const schedule = controls
  ? [...tasks.map((t: any) => ({ caseId: t.case.id, model: "fixture", control: "valid", repetition: 1 })), ...["wrong-price", "wrong-action", "malformed"].map((control) => ({ caseId: "C01", model: "fixture", control, repetition: 1 }))]
  : Array.from({ length: repetitions }, (_, i) => shuffle(models.flatMap((m) => tasks.map((t: any) => ({ caseId: t.case.id, model: m.id, repetition: i + 1 }))))).flat();
await save("schedule.json", schedule);
try {
  const { default: promptfoo } = await import("promptfoo");
  const evaluation = await promptfoo.evaluate({
    writeLatestResults: true,
    description: `json-render instrumentation pilot: ${runId}`,
    prompts: ["{{caseId}}"], providers,
    tests: schedule.map((row) => ({ description: `${row.caseId} / ${row.model} / block ${row.repetition}${row.control ? ` / ${row.control}` : ""}`, vars: row, providers: [row.model], assert: [{ type: "javascript" as const, value: (_output: any, context: any) => {
      const actual = context.providerResponse.metadata;
      const expected = !row.control || row.control === "valid";
      const pass = actual.automaticPass === expected;
      return { pass, score: pass ? 1 : 0, reason: pass ? "Expected layer verdicts" : JSON.stringify(actual.verdicts), namedScores: Object.fromEntries(Object.entries(actual.verdicts).map(([k, v]: any) => [k, v.pass ? 1 : 0])) };
    } }] })),
  }, { cache: false, maxConcurrency: 1, repeat: 1, showProgressBar: false });
  await save("promptfoo.json", await evaluation.toEvaluateSummary());
} finally {
  await browser.close(); await new Promise<void>((done) => server.close(() => done()));
  await save("trials.json", trials);
  await save("summary.json", { runId, intendedTrials: schedule.length, completedTrials: trials.length, automaticPasses: trials.filter((t) => t.automaticPass).length, knownChargeUsd: trials.reduce((sum, t) => sum + (t.costUsd ?? 0), 0), unknownChargeTrials: trials.filter((t) => t.costUsd === null).length, reservedOrSpentUsd: budget?.used ?? 0, fatal: fatal ?? null, manualReview: "pending" });
  console.log(`Artifacts: ${out}`);
}
if (fatal) throw new Error(fatal);
if (trials.length !== schedule.length) throw new Error("Incomplete evaluation; inspect Promptfoo errors");
if (controls && trials.some((t) => t.automaticPass !== (t.control === "valid"))) process.exitCode = 1;
if (controls && trials.filter((t) => t.control === "valid").some((t) => t.browser.firstMeaningful === null || t.browser.firstMeaningful >= t.browser.streamEnd - 200 || t.browser.usable === null)) throw new Error("Controlled streaming timing assertions failed");
