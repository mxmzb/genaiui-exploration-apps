import { useEffect, useRef } from "react";
import { inspectDOM, checkRecord } from "../json-render/observe";
import { exerciseActions, until, wait } from "./actions";
import { environmentErrors } from "./Stage";
export function Observer({ trial, agent, isReady = true, copilotkit, driver }: { trial: any; agent?: any; isReady?: boolean; copilotkit?: any; driver?: { run: (prompt: string) => Promise<void>; restore: () => Promise<void> } }) {
  const started = useRef(false);
  useEffect(() => {
    if (!isReady || started.current) return;
    started.current = true;
    let frame = 0,
      done = false;
    const start = performance.now(),
      metrics: any = {
        timeline: [],
        firstMeaningfulMs: null,
        firstCompleteCardMs: null,
        allContentMs: null,
        usableMs: null,
        runEndMs: null,
      };
    let previous = "";
    const sample = () => {
      const dom = inspectDOM(trial.task),
        ms = performance.now() - start;
      const complete = dom.records.filter(
        (r: any, i: number) =>
          r.found &&
          checkRecord(trial.task.records[i], r, trial.task.case.expected.fields)
            .length === 0,
      ).length;
      const pending = document.querySelectorAll(
        ".generated-ui [data-pending]",
      ).length;
      const renderedFields = [
        ...document.querySelectorAll(".generated-ui .ui-metric strong"),
      ].filter((el) => !el.querySelector("[data-pending]")).length;
      const state = JSON.stringify([
        dom.recordIds,
        complete,
        pending,
        renderedFields,
        dom.enabledButtons,
      ]);
      if (previous !== state) {
        metrics.timeline.push({
          ms,
          ids: dom.recordIds,
          complete,
          pending,
          renderedFields,
          enabledButtons: dom.enabledButtons,
        });
        previous = state;
      }
      if (dom.meaningful) metrics.firstMeaningfulMs ??= ms;
      if (complete) metrics.firstCompleteCardMs ??= ms;
      if (dom.errors.length === 0 && !pending) metrics.allContentMs ??= ms;
      if (dom.ready && !pending) metrics.usableMs ??= ms;
      if (!done) frame = requestAnimationFrame(sample);
      return dom;
    };
    // Same public run path as the app composer. The renderer, catalog and runtime
    // are imported from the app; the oracle is confined to this observer.
    async function run() {
      let runError: string | undefined;
      const environmentFailures = environmentErrors();
      const changed = () => environmentFailures.push("Viewport or visibility changed during the trial");
      addEventListener("resize", changed);
      document.addEventListener("visibilitychange", changed);
      try {
        if (environmentFailures.length) throw Error(environmentFailures.join("; "));
        if (!driver) agent.addMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: trial.task.case.prompt,
        });
        sample();
        await (driver ? driver.run(trial.task.case.prompt) : copilotkit.runAgent({ agent }));
      } catch (e) {
        runError = String(e);
      }
      metrics.runEndMs = performance.now() - start;
      await new Promise((r) => setTimeout(r, 150));
      done = true;
      cancelAnimationFrame(frame);
      const dom = sample();
      removeEventListener("resize", changed);
      document.removeEventListener("visibilitychange", changed);
      dom.errors.push(...environmentFailures);
      const pending = document.querySelectorAll(
        ".generated-ui [data-pending]",
      ).length;
      if (pending) dom.errors.push(`${pending} unresolved fields`);
      const alerts = [
        ...document.querySelectorAll(
          '[role="alert"],[data-generative-ui-error]',
        ),
      ].map((n) => n.textContent);
      const html = document.querySelector(".generated-ui")?.outerHTML;
      const baseline = agent ? structuredClone(agent.messages) : null;
      const restore = async () => {
        if (driver) { await driver.restore(); return; }
        await until(() => !agent.isRunning, "Action run did not finish");
        agent.setMessages(structuredClone(baseline));
        await wait(40);
      };
      let interaction: any = { pass: false, errors: ["Generation failed before interaction checks"], checks: [] };
      if (!runError) {
        try { interaction = await exerciseActions(trial, restore); }
        catch (e) { interaction = { pass: false, errors: [String(e)], checks: [] }; }
      }
      if (!interaction.pass) metrics.usableMs = null;
      await fetch(`/report/${trial.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          metrics,
          interaction,
          dom,
          runError,
          alerts,
          html,
          environment: {
            userAgent: navigator.userAgent,
            viewport: [innerWidth, innerHeight],
            devicePixelRatio,
            visibility: document.visibilityState,
            assets: "local-svg/system-fonts",
            failures: environmentFailures,
          },
        }),
      });
    }
    void run();
    return () => {
      done = true;
      cancelAnimationFrame(frame);
    };
  }, [agent, isReady, copilotkit, trial, driver]);
  return null;
}
