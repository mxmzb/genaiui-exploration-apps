import { createServer } from "node:http";
import { readFile, writeFile, mkdir, readdir, open } from "node:fs/promises";
import { resolve, extname, relative } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { createCopilotRuntimeHandler } from "../../a2ui-copilotkit/node_modules/@copilotkit/runtime/dist/v2/index.mjs";
import { createCopilotNodeHandler } from "../../a2ui-copilotkit/node_modules/@copilotkit/runtime/dist/v2/node.mjs";
import { createApartmentRuntime as createA2UIRuntime } from "../../a2ui-copilotkit/src/lib/runtime.ts";
import { variants as a2uiVariants } from "../../a2ui-copilotkit/src/lib/variants.ts";
import { getSystemPrompt as a2uiPrompt } from "../../a2ui-copilotkit/src/lib/prompts.ts";
import { providerTransport, Ledger } from "../a2ui/transport.ts";
import { validate as validateA2UI } from "../a2ui/validate.ts";
import { checkActionBindings as a2uiActions } from "../a2ui/actions.ts";

import { createCopilotRuntimeHandler as createOpenUIHandler } from "../../openui-copilotkit/node_modules/@copilotkit/runtime/dist/v2/index.mjs";
import { createApartmentRuntime as createOpenUIRuntime } from "../../openui-copilotkit/src/lib/runtime.ts";
import { getSystemPrompt as openuiPrompt } from "../../openui-copilotkit/src/lib/prompts.ts";
import { fixture as openuiFixture } from "../openui/fixtures.ts";
import { validate as validateOpenUI, checkActionBindings as openuiActions } from "../openui/validate.ts";

import { createCopilotRuntimeHandler as createHashbrownHandler } from "../../hashbrown-copilotkit/node_modules/@copilotkit/runtime/dist/v2/index.mjs";
import { createApartmentRuntime as createHashbrownRuntime } from "../../hashbrown-copilotkit/src/lib/runtime.ts";
import { getSystemPrompt as hashbrownPrompt } from "../../hashbrown-copilotkit/src/lib/prompts.ts";
import { fixture as hashbrownFixture } from "../hashbrown/fixtures.ts";
import { validate as validateHashbrown, checkActionBindings as hashbrownActions } from "../hashbrown/validate.ts";

import { actionRequest } from "./action-request.ts";
import { generateUI } from "../../json-render-standalone/src/lib/generate-ui.ts";
import { getSystemPrompt as jsonPrompt } from "../../json-render-standalone/src/lib/prompts.ts";
import { fixture as jsonFixture } from "../json-render/shared-fixtures.ts";
import { validateOutput as validateJSON } from "../json-render/validate.ts";

process.env.PROMPTFOO_DISABLE_TELEMETRY = "1";
process.env.PROMPTFOO_DISABLE_UPDATE = "1";
process.env.COPILOTKIT_TELEMETRY_DISABLED = "true";
process.env.PROMPTFOO_CONFIG_DIR = resolve(".promptfoo");
const { values } = parseArgs({
  options: {
    framework: { type: "string", default: "a2ui" },
    mode: { type: "string", default: "replay" },
    "max-spend-usd": { type: "string" },
    port: { type: "string", default: "15501" },
    cases: { type: "string", default: "C01,C02,C03,C04,C05,C06" },
    variants: { type: "string" },
    "skip-controls": { type: "boolean", default: false },
  },
});
if (!["a2ui", "openui", "hashbrown", "json-render"].includes(values.framework!)) throw Error("Unknown framework");
const framework = values.framework!;
const variants: any[] = framework === "a2ui" ? a2uiVariants : [{ transport: "text", generation: "native" }];
const variantId = (v: any) => `${v.transport}-${v.generation}`;
const getSystemPrompt = (v: any, records: any, today: string) => framework === "json-render" ? jsonPrompt(true, records, today) : framework === "hashbrown" ? hashbrownPrompt(records, today) : framework === "openui" ? openuiPrompt(records, today) : a2uiPrompt(v, records, today);
const validate = (raw: string, v: any) => framework === "json-render" ? (() => { const result = validateJSON(raw); return { ...result, operations: result.spec, strategy: {pass:true,errors:[]}, recovery: null }; })() : framework === "hashbrown" ? validateHashbrown(raw) : framework === "openui" ? validateOpenUI(raw) : validateA2UI(raw, v);
const checkActionBindings = (ops: any, task: any) => framework === "json-render" ? { pass: true, errors: [], note: "Native catalog/action validation plus observed action dispatch; no separate redundant tree walk" } : framework === "hashbrown" ? hashbrownActions(ops, task) : framework === "openui" ? openuiActions(ops, task) : a2uiActions(ops, task);
if (!["replay", "live", "plan"].includes(values.mode!))
  throw Error("Use --mode replay|live|plan");
const live = values.mode === "live",
  hash = (v: string | Buffer) => createHash("sha256").update(v).digest("hex");
const json = async (p: string) => JSON.parse(await readFile(p, "utf8"));
const dataset = await json("v4/dataset.json"),
  cases = await json("v4/cases.json");
const selected = variants.filter(
  (v) => (values.variants ? values.variants.split(",").includes(variantId(v)) : framework !== "a2ui" || v.generation === "batch"),
);
const tasks = cases.generation
  .filter((c: any) => values.cases!.split(",").includes(c.id))
  .map((c: any) => ({
    case: c,
    records: c.input_ids.map((id: string) =>
      dataset.records.find((r: any) => r.id === id),
    ),
    otherRecords: dataset.records.filter(
      (r: any) => !c.input_ids.includes(r.id),
    ),
  }));
if (
  !selected.length ||
  tasks.length !== values.cases!.split(",").length ||
  tasks.some((t: any) => !["C01", "C02", "C03", "C04", "C05", "C06"].includes(t.case.id))
)
  throw Error("Use valid variants and C01–C06");
if (framework === "a2ui" && selected.some(v => ["records", "fields"].includes(v.generation)) && tasks.some((t: any) => !["C02", "C03"].includes(t.case.id))) throw Error("Record/field strategy comparisons currently cover C02/C03; use --cases C02,C03. The shared six-case baseline uses batch transport variants.");
if (framework === "json-render" && live) throw Error("Shared json-render live provider/route wiring is pending for the selected models. Replay is ready; no paid calls started.");
const appDirectory = framework === "json-render" ? "json-render-standalone" : `${framework}-copilotkit`;
const browserDirectory = framework === "json-render" ? "json-render/shared" : framework;
const model: any = {
  id: live || values.mode === "plan" ? "openai/gpt-5.4" : "replay",
  providerTag: "azure/eu",
  providerName: "Azure",
  reasoning: "low",
  maxOutputTokens: 16000,
};
if (live || values.mode === "plan") {
  const response = await fetch(
    `https://openrouter.ai/api/v1/models/${model.id}/endpoints`,
  );
  if (!response.ok) throw Error("Cannot fetch current prices");
  const data: any = await response.json();
  const endpoint = data.data.endpoints.find(
    (e: any) => e.tag === model.providerTag,
  );
  if (!endpoint) throw Error("Pinned provider unavailable");
  model.pricing = endpoint.pricing;
}
const schedule = tasks.flatMap((task: any, i: number) =>
  [...selected.slice(i), ...selected.slice(0, i)].map((variant) => ({
    task,
    variant,
    control: "valid",
    expectedFailure: null,
  })),
);
if (!live && values.mode !== "plan" && !values["skip-controls"]) {
  const controls = [["C01", "wrong-price", "content"], ["C01", "wrong-action", "interaction"], ["C01", "missing-field", "content"], ["C01", "invalid-component", "contract"], ["C01", "truncated", "contract"], ["C01", "dead-action", "interaction"], ["C04", "wrong-fee", "content"], ["C05", "hallucinated-record", "content"], ["C05", "unexpected-action", "content"], ["C06", "missing-required", "interaction"], ["C06", "wrong-form-target", "interaction"]];
  for (const [caseId, control, expectedFailure] of controls) {
    const task = tasks.find((t: any) => t.case.id === caseId);
    if (task) for (const variant of selected) schedule.push({ task, variant, control, expectedFailure });
  }
}
console.log(
  JSON.stringify(
    {
      mode: values.mode,
      model,
      trials: schedule.length,
      maxSpendUsd: values["max-spend-usd"] ?? null,
      retries: 0,
      ledger: "results/a2ui-campaign-ledger.json",
      notes:
        "One generation per case/variant. A byte-based conservative reservation is persisted before each actual request, including the runtime-injected catalog/schema. No automatic retries.",
    },
    null,
    2,
  ),
);
if (values.mode === "plan") process.exit(0);
await mkdir("results", { recursive: true });
let lock: Awaited<ReturnType<typeof open>> | undefined;
const ledger = live
  ? new Ledger(
      resolve("results/a2ui-campaign-ledger.json"),
      Number(values["max-spend-usd"]),
    )
  : undefined;
if (live) {
  if (!process.env.OPENROUTER_API_KEY)
    throw Error("Missing OPENROUTER_API_KEY; no calls started");
  lock = await open("results/a2ui-campaign.lock", "wx");
  await ledger!.load();
}
const runId = `${framework}-${new Date().toISOString().replace(/[:.]/g, "-")}-${values.mode}`,
  out = resolve("results", runId);
await mkdir(out);
const save = (name: string, data: any) =>
  writeFile(resolve(out, name), JSON.stringify(data, null, 2));
execFileSync(
  process.execPath,
  [
    resolve(`../${appDirectory}/node_modules/vite/bin/vite.js`),
    "build",
    "--config",
    resolve(`${browserDirectory}/vite.config.ts`),
  ],
  { stdio: "pipe" },
);
const sourceFiles: Record<string, string> = {};
async function fingerprint(path: string) {
  for (const e of await readdir(path, { withFileTypes: true })) {
    if (["node_modules", "dist"].includes(e.name)) continue;
    const p = resolve(path, e.name);
    if (e.isDirectory()) await fingerprint(p);
    else sourceFiles[relative(resolve(".."), p)] = hash(await readFile(p));
  }
}
await fingerprint(`../${appDirectory}/src`);
await fingerprint(framework);
await fingerprint("common");
if (framework === "json-render") await fingerprint("../json-render-standalone/patches");
for (const p of [
  `../${appDirectory}/pnpm-lock.yaml`,
  "a2ui/transport.ts",
  "pnpm-lock.yaml",
  "json-render/observe.ts",
  "json-render/budget.ts",
  "v4/dataset.json",
  "v4/cases.json",
])
  sourceFiles[p] = hash(await readFile(p));
await save("manifest.json", {
  runId,
  framework,
  mode: values.mode,
  model,
  createdAt: new Date().toISOString(),
  sourceFiles,
  sourceHash: hash(JSON.stringify(sourceFiles)),
  gitCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  fixtureRevision: 4,
  fixtureDirectory: "v4",
  viewport: [1280, 900],
  clock: cases.clock,
  cache: "No response cache; provider input cache reported in usage",
  delivery: live
    ? "Provider stream"
    : "96 UTF-16 characters per 8 ms plus 250 ms end hold; not model speed",
  images:
    "Photo URLs are preserved in the DOM; a benchmark-only service worker supplies one local SVG for every Unsplash request. System fonts. Photo realism and network latency are excluded.",
  timing:
    "Real browser animation frames; viewport/environment recorded per trial; observer hooks the same runAgent path as the composer",
  actionCoverage:
    "Each trial clicks all required record/navigation controls, checks captured server actions, and exercises invalid/valid form submissions. A no-generation sink isolates dispatch from subsequent view generation.",
  schedule: schedule.map((s) => ({
    variant: variantId(s.variant as any),
    caseId: s.task.case.id,
    control: s.control,
  })),
});
let current: any,
  status = "ready",
  version = 0,
  completed = 0,
  result: any,
  fatal: string | undefined;
const trials: any[] = [];
const providers = selected.map((variant) => ({
  id: () => variantId(variant),
  label: variantId(variant),
  handlesOwnRetries: true,
  async callApi(_p: string, context: any) {
    if (fatal) return { error: fatal };
    const slot = schedule[context.vars.slot],
      id = `${runId}-${context.vars.slot}-${variantId(slot.variant)}-${slot.task.case.id}`;
    const trial: any = {
      id,
      framework,
      variant: slot.variant,
      task: slot.task,
      control: slot.control,
      expectedFailure: slot.expectedFailure,
      actionRequests: [],
      promptHash: hash(
        getSystemPrompt(
          slot.variant,
          slot.task.records,
          cases.clock.slice(0, 10),
        ) + slot.task.case.prompt,
      ),
    };
    if (!live && framework === "json-render") trial.replayRaw = jsonFixture(slot.task, slot.control);
    if (!live && framework === "hashbrown") trial.replayRaw = hashbrownFixture(slot.task, slot.control);
    if (!live && framework === "openui") trial.replayRaw = openuiFixture(slot.task, slot.control);
    const runtimeOptions = {
      records: slot.task.records,
      today: cases.clock.slice(0, 10),
      model: model.id,
      provider: model.providerTag,
      openRouter: true,
      fetch: providerTransport(trial, live, model, ledger),
    };
    if (framework !== "json-render") trial.handler = createCopilotNodeHandler(
      framework === "hashbrown" ? createHashbrownHandler({ runtime: createHashbrownRuntime(runtimeOptions), basePath: `/runtime/${id}` }) : framework === "openui" ? createOpenUIHandler({ runtime: createOpenUIRuntime(runtimeOptions), basePath: `/runtime/${id}` }) : createCopilotRuntimeHandler({ runtime: createA2UIRuntime(runtimeOptions), basePath: `/runtime/${id}` }),
    );
    let timer: ReturnType<typeof setTimeout>;
    const report = new Promise<any>((r) => {
      trial.resolve = r;
      timer = setTimeout(
        () =>
          r({
            runError: "Browser deadline exceeded",
            dom: { errors: ["No final DOM"] },
          }),
        180000,
      );
    });
    current = trial;
    status = `Running ${variantId(slot.variant)} ${slot.task.case.id} (${slot.control})`;
    version++;
    const browser = await report;
    clearTimeout(timer!);
    await trial.capture;
    if (live) {
      await ledger!.settle(id, trial.usage?.cost);
      if (
        trial.httpStatus !== 200 ||
        trial.providerError ||
        trial.captureError ||
        trial.servingProvider !== model.providerName ||
        !trial.returnedModel?.startsWith(model.id) ||
        typeof trial.usage?.cost !== "number"
      )
        fatal =
          "Provider/usage verification failed; stopped before another paid call";
    }
    const parsed = validate(trial.raw ?? "", slot.variant),
      actionBindings = checkActionBindings(parsed.operations, slot.task);
    const verdicts: any = {
      rawFormat: parsed.rawFormat,
      contract: parsed.contract,
      strategy: parsed.strategy,
      content: {
        pass: !!browser.dom && browser.dom.errors.length === 0,
        errors: browser.dom?.errors ?? ["Missing DOM"],
      },
      actionBindings,
      interaction: browser.interaction ?? { pass: false, errors: ["Missing interaction evidence"] },
      runtime: {
        pass:
          !browser.runError &&
          !browser.alerts?.length &&
          !trial.providerError &&
          !trial.captureError &&
          trial.httpStatus === 200,
        errors: [
          browser.runError,
          ...(browser.alerts ?? []),
          trial.providerError,
          trial.captureError,
        ].filter(Boolean),
      },
    };
    if (browser.metrics && (!actionBindings.pass || !parsed.contract.pass || !verdicts.runtime.pass || !verdicts.interaction.pass)) browser.metrics.usableMs = null;
    const automaticPass = Object.entries(verdicts)
      .filter(([key]) => key !== "rawFormat")
      .every(([, v]: any) => v.pass);
    const pass = slot.expectedFailure
      ? !verdicts[slot.expectedFailure].pass
      : automaticPass;
    const record = {
      id,
      variant: slot.variant,
      caseId: slot.task.case.id,
      control: slot.control,
      expectedFailure: slot.expectedFailure,
      pass,
      automaticPass,
      verdicts,
      recovery: parsed.recovery,
      browser,
      request: trial.request,
      actionRequests: trial.actionRequests,
      events: trial.events,
      raw: trial.raw,
      usage: trial.usage,
      costUsd: trial.usage?.cost ?? null,
      reservedUsd: trial.reservedUsd,
      providerFinishedMs: trial.providerFinishedMs,
      firstTokenMs: trial.firstTokenMs,
      servingProvider: trial.servingProvider,
      returnedModel: trial.returnedModel,
      promptHash: trial.promptHash,
    };
    await save(`${context.vars.slot}.json`, record);
    trials.push(record);
    completed++;
    version++;
    console.log(
      JSON.stringify({
        completed,
        variant: variantId(slot.variant),
        case: slot.task.case.id,
        control: slot.control,
        pass,
        failed: Object.keys(verdicts).filter((k) => !verdicts[k].pass),
        cost: record.costUsd,
      }),
    );
    return {
      output: JSON.stringify({
        pass,
        automaticPass,
        verdicts,
        timing: browser.metrics,
        costUsd: record.costUsd,
      }),
      cost: record.costUsd ?? 0,
      tokenUsage: {
        total: trial.usage?.total_tokens ?? 0,
        prompt: trial.usage?.prompt_tokens ?? 0,
        completion: trial.usage?.completion_tokens ?? 0,
      },
    };
  },
}));
// Negative controls may use a variant excluded by a filtered run.
for (const slot of schedule)
  if (!providers.some((p) => p.id() === variantId(slot.variant)))
    throw Error(
      "Filtered replay must include all variants needed by negative controls",
    );
async function run() {
  status = "Starting";
  version++;
  try {
    const { default: promptfoo } = await import("promptfoo");
    const evaluation = await promptfoo.evaluate(
      {
        writeLatestResults: true,
        description: `${framework} ${values.mode}: native generation, fixture v4`,
        prompts: ["{{caseId}}"],
        providers,
        tests: schedule.map((s, i) => ({
          vars: { slot: i, caseId: s.task.case.id, control: s.control },
          providers: [variantId(s.variant)],
          assert: [
            {
              type: "javascript",
              value: (output: string) => JSON.parse(output).pass,
            },
          ],
        })),
      },
      { cache: false, maxConcurrency: 1, repeat: 1, showProgressBar: false },
    );
    const evaluated = await evaluation.toEvaluateSummary();
    await save("promptfoo.json", evaluated);
    result = {
      evalId: evaluation.id,
      passed: trials.filter((t) => t.pass).length,
      total: trials.length,
      chargedUsd: trials.reduce((n, t) => n + (t.costUsd ?? 0), 0),
      campaignChargedOrReservedUsd: ledger?.used ?? 0,
      failures: trials
        .filter((t) => !t.pass)
        .map((t) => ({
          variant: variantId(t.variant),
          case: t.caseId,
          control: t.control,
          verdicts: t.verdicts,
        })),
      artifacts: out,
      fatal,
    };
    await save("summary.json", result);
    status = fatal ? "stopped" : "complete";
  } catch (e) {
    status = "failed";
    result = { error: String(e), artifacts: out };
    console.error(e);
  } finally {
    version++;
    if (lock) {
      await lock.close();
      const { unlink } = await import("node:fs/promises");
      await unlink("results/a2ui-campaign.lock");
      lock = undefined;
    }
  }
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, "http://localhost"),
      path = url.pathname;
    const send = (data: any) => {
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(data));
    };
    if (path === "/state") {
      send({
        version,
        status,
        mode: values.mode,
        completed,
        total: schedule.length,
        used: ledger?.used ?? 0,
        trial: current
          ? { id: current.id, framework, variant: current.variant, task: current.task }
          : null,
        result,
      });
      return;
    }
    if (path === "/start" && req.method === "POST") {
      if (status === "ready") void run();
      send({ status });
      return;
    }
    if (path.startsWith("/report/") && req.method === "POST") {
      let body = "";
      for await (const c of req) body += c;
      if (current && path === `/report/${current.id}`)
        current.resolve(JSON.parse(body));
      send({ ok: true });
      return;
    }
    if (path.startsWith("/actions/") && current && path === `/actions/${current.id}`) {
      send({ requests: current.actionRequests }); return;
    }
    if (path === "/api/surface" && req.method === "POST" && framework === "json-render" && current) {
      let body = ""; for await (const chunk of req) body += chunk;
      const parsed = JSON.parse(body);
      if (current.invoked) {
        current.actionRequests.push(actionRequest(parsed, framework));
        res.writeHead(200, { "content-type": "text/plain" }); res.end(); return;
      }
      current.invoked = true;
      const abort = new AbortController(); res.on("close", () => { if (!res.writableEnded) abort.abort(); });
      const response = await generateUI(new Request("http://localhost/api/surface", { method: "POST", body, signal: abort.signal }), true, {
        model: model.id, apiKey: "replay-not-a-key", baseURL: "https://openrouter.ai/api/v1", systemPrompt: jsonPrompt(true, current.task.records, cases.clock.slice(0,10)), fetch: providerTransport(current, false, model),
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) for await (const chunk of response.body) res.write(chunk);
      res.end(); return;
    }
    if (path.startsWith("/runtime/") && current) {
      if (req.method === "POST" && path.endsWith("/run")) {
        let body = "";
        for await (const c of req) body += c;
        const parsed = JSON.parse(body);
        (req as any).body = parsed;
        if (current.invoked) {
          current.actionRequests.push(actionRequest(parsed, framework));
          await save("dispatch-smoke.json", current.actionRequests);
          res.writeHead(200, { "content-type": "text/event-stream" });
          for (const type of ["RUN_STARTED", "RUN_FINISHED"])
            res.write(
              `data: ${JSON.stringify({ type, threadId: parsed.threadId, runId: parsed.runId })}\n\n`,
            );
          res.end();
          return;
        }
        current.invoked = true;
      }
      await current.handler(req, res);
      return;
    }
    const file = resolve(
      `${browserDirectory}/dist`,
      path === "/" ? "index.html" : path.slice(1),
    );
    if (!file.startsWith(resolve(`${browserDirectory}/dist`) + "/"))
      throw Error("Invalid path");
    const bytes = await readFile(file);
    res.writeHead(200, {
      "content-type":
        (
          {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
            ".svg": "image/svg+xml",
          } as any
        )[extname(file)] ?? "application/octet-stream",
    });
    res.end(bytes);
  } catch (e: any) {
    if (!res.headersSent) res.writeHead(e.code === "ENOENT" ? 404 : 500);
    res.end(String(e));
  }
});
server.listen(Number(values.port), "127.0.0.1", () =>
  console.log(
    `Open http://127.0.0.1:${values.port}/ and click Run suite. Artifacts: ${out}`,
  ),
);
