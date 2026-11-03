import React from "../../json-render-standalone/node_modules/react/index.js";
import { createRoot } from "../../json-render-standalone/node_modules/react-dom/client.js";
import { registerActionObserver } from "../../json-render-standalone/node_modules/@json-render/core/dist/index.mjs";
import { ApartmentFinder } from "../../json-render-standalone/src/components/ApartmentFinder";
import "../../json-render-standalone/src/styles.css";
import { inspectDOM } from "./observe";

const state = window as any;
state.benchmark = { started: null, firstMeaningful: null, usable: null, actions: [], observations: [] };
// Observe delivery without buffering or modifying the bytes consumed by useChatUI.
const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (String(args[0]).includes("/api/surface") && !state.benchmark.observingStream) {
    const b = state.benchmark;
    b.observingStream = true;
    b.httpStatus = response.status;
    const reader = response.clone().body!.getReader();
    void (async () => {
      try {
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          if (b.firstDelivery == null) b.firstDelivery = performance.now() - b.started;
        }
      } catch { b.streamError = true; }
      finally { b.streamEnd = performance.now() - b.started; }
    })();
  }
  return response;
};
registerActionObserver({ onDispatch: (event) => state.benchmark.actions.push(event) });
state.inspectBenchmark = () => inspectDOM(state.benchmarkTask);
document.addEventListener("click", (event) => {
  if ((event.target as Element).closest('button[aria-label="Send message"]') && state.benchmark.started === null) {
    state.benchmark.started = performance.now();
  }
}, true);
function observe() {
  const b = state.benchmark;
  if (b.started !== null && state.benchmarkTask && !b.stopped) {
    const result = inspectDOM(state.benchmarkTask);
    const elapsed = performance.now() - b.started;
    if (result.meaningful && b.firstMeaningful === null) b.firstMeaningful = elapsed;
    if (result.ready && b.usable === null) b.usable = elapsed;
    const signature = `${result.recordIds.join(",")}:${result.enabledButtons}:${result.errors.join("|")}`;
    if (signature !== b.lastSignature) {
      b.observations.push({ ms: elapsed, recordIds: result.recordIds, enabledButtons: result.enabledButtons, errors: result.errors });
      b.lastSignature = signature;
    }
  }
  requestAnimationFrame(observe);
}
requestAnimationFrame(observe);
createRoot(document.getElementById("root")!).render(<ApartmentFinder surface />);
