import { readFile } from "node:fs/promises";
import { checkActions } from "./validate.ts";

export async function observeTrial(browser: any, baseURL: string, trial: any, directory: string) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US", timezoneId: "UTC", serviceWorkers: "block" });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
  const image = await readFile(new URL("./image.svg", import.meta.url));
  await context.route("https://images.unsplash.com/**", (route: any) => route.fulfill({ contentType: "image/svg+xml", body: image }));
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route: any) => route.abort());
  const page = await context.newPage();
  trial.browserErrors = [];
  page.on("pageerror", (error: Error) => trial.browserErrors.push(error.message));
  try {
    await page.clock.setFixedTime(new Date("2026-11-02T12:00:00Z"));
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "* { font-family: system-ui, sans-serif !important; }" });
    const viewport = await page.evaluate(() => [innerWidth, innerHeight]);
    if (viewport[0] !== 1280 || viewport[1] !== 900) throw Error("Unexpected measurement viewport");
    await page.evaluate((task: any) => { (window as any).benchmarkTask = task; }, trial.task);
    await page.locator("#apartment-search").fill(trial.task.case.prompt);
    await page.getByRole("button", { name: "Send message", exact: true }).click();
    await page.waitForFunction(() => (window as any).benchmark.streamEnd !== undefined, { }, { timeout: 125_000 });
    await page.waitForFunction(() => !document.querySelector(".loading-state"), {}, { timeout: 5000 });
    // Let React commit the EOF update; no arbitrary model-dependent settling delay.
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    trial.dom = await page.evaluate(() => (window as any).inspectBenchmark());
    trial.browser = await page.evaluate(() => {
      const b = (window as any).benchmark;
      b.finished = performance.now() - b.started; b.stopped = true;
      return b;
    });
    await page.screenshot({ path: `${directory}/final.png`, fullPage: true });
    trial.finalHTML = await page.locator(".finder").innerHTML();
    const clicks: any[] = [];
    const buttons = page.locator(".generated-ui button");
    for (let i = 0; i < trial.dom.buttons.length; i++) {
      const button = buttons.nth(i);
      const info = trial.dom.buttons[i];
      if (!info.enabled) { clicks.push({ ...info, events: [] }); continue; }
      const before = await page.evaluate(() => (window as any).benchmark.actions.length);
      const requestsBefore = trial.actionRequests.length;
      await button.click({ timeout: 3000 });
      await page.waitForFunction(() => !document.querySelector(".generated-ui:disabled"), {}, { timeout: 3000 });
      const events = await page.evaluate((n: number) => (window as any).benchmark.actions.slice(n), before);
      clicks.push({ ...info, events, requests: trial.actionRequests.slice(requestsBefore) });
    }
    trial.clicks = clicks;
    trial.actions = checkActions(trial.task.case, clicks);
    for (const click of clicks) if (click.requests?.length !== 1) { trial.actions.pass = false; trial.actions.errors.push(`${click.label}: real handler did not reach request sink exactly once`); }
    if (!trial.actions.pass) trial.browser.usable = null;
  } catch (error) {
    trial.browserError = String(error);
    trial.dom ??= await page.evaluate(() => (window as any).inspectBenchmark?.()).catch(() => null);
    trial.browser ??= await page.evaluate(() => (window as any).benchmark).catch(() => null);
    trial.actions ??= { pass: false, errors: ["Browser/action sequence incomplete"] };
    await page.screenshot({ path: `${directory}/final.png`, fullPage: true }).catch(() => {});
  } finally {
    await context.tracing.stop({ path: `${directory}/trace.zip` });
    await context.close();
  }
}
