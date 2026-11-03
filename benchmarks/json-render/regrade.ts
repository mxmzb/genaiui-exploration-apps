// Re-evaluate saved DOM with a corrected checker. No model calls and no new live timings.
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
const root = resolve(process.argv[2]);
const input = await readFile(`${root}/trials.json`, "utf8");
const trials = JSON.parse(input);
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const server = createServer(async (req, res) => {
  try {
    const file = resolve("json-render/dist", req.url === "/" ? "index.html" : req.url!.slice(1));
    if (!file.startsWith(resolve("json-render/dist") + "/")) throw new Error("Invalid path");
    res.setHeader("content-type", ({ ".html": "text/html", ".css": "text/css", ".js": "application/javascript" } as any)[extname(file)] ?? "text/plain");
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.route("https://**", (route) => route.abort());
const rows: any[] = [];
try {
  for (const trial of trials) {
    await page.goto(`http://127.0.0.1:${(server.address() as any).port}`, { waitUntil: "networkidle" });
    const html = await readFile(`${root}/${trial.id}/final.html`, "utf8");
    await page.evaluate(({ task, html }) => {
      (window as any).benchmarkTask = task;
      document.querySelector(".finder")!.innerHTML = html;
    }, { task: trial.task, html });
    const dom = await page.evaluate(() => (window as any).inspectBenchmark());
    const content = { pass: dom.errors.length === 0, errors: dom.errors };
    const verdicts = { ...trial.verdicts, content };
    const pass = Object.entries(verdicts).filter(([name]) => name !== "rawFormat").every(([, v]: any) => v.pass);
    rows.push({ id: trial.id, originalPass: trial.automaticPass, revisedPass: pass, content, dom });
    console.log(`${trial.id}: ${trial.automaticPass} → ${pass}; ${dom.errors.join("; ")}`);
  }
  await writeFile(`${root}/regrade.json`, JSON.stringify({
    kind: "offline DOM regrade; no new model calls or live timings", createdAt: new Date().toISOString(),
    sourceTrialsHash: hash(input), checkerHash: hash(await readFile("json-render/observe.ts", "utf8")),
    changes: ["A single supplied record may span multiple cards; inspect its entire generated view", "Accept semantically equivalent fee labels and correctly labeled aggregate mandatory monthly fees for comparison tasks"],
    rows,
  }, null, 2));
} finally { await browser.close(); server.close(); }
