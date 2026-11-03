import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useMemo } from "react";
import { ApartmentFinder } from "../../../json-render-standalone/src/components/ApartmentFinder";
import { Observer } from "../../common/Observer";
import { Stage, inStage } from "../../common/Stage";
import { setField, until, wait } from "../../common/actions";
import "../../../json-render-standalone/src/styles.css";
function ObservedApp({ trial }: { trial: any }) {
  const driver = useMemo(() => ({
    async run(prompt: string) {
      let finished = false, seen = false, failure: any;
      const original = window.fetch;
      window.fetch = async (...args) => {
        const response = await original(...args);
        if (String(args[0]).includes("/api/surface") && !seen) {
          seen = true;
          void response.clone().text().then(() => { finished = true; }, e => { failure = e; finished = true; });
        }
        return response;
      };
      try {
        const input = document.querySelector<HTMLInputElement>("#apartment-search")!;
        setField(input, prompt); await wait(40);
        (document.querySelector('.composer button[type="submit"]') as HTMLButtonElement).click();
        await until(() => finished, "json-render response did not finish", 120000);
        if (failure) throw failure;
        await until(() => !input.disabled, "json-render did not become idle");
      } finally { window.fetch = original; }
    },
    async restore() { await until(() => !(document.querySelector<HTMLInputElement>("#apartment-search")?.disabled), "Action did not finish"); await wait(40); },
  }), []);
  return <><ApartmentFinder surface /><Observer trial={trial} driver={driver} /></>;
}
function Bench() {
  const [state, setState] = useState<any>({ status: "Connecting" });
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const next = await fetch("/state").then((r) => r.json());
        if (active)
          setState((old: any) => (old.version === next.version ? old : next));
      } finally {
        if (active) setTimeout(poll, 500);
      }
    };
    void poll();
    return () => {
      active = false;
    };
  }, []);
  if (inStage) return state.trial ? (
    <ObservedApp key={state.trial.id} trial={state.trial} />
  ) : <p style={{padding: 24}}>Ready for a measured run.</p>;
  return (
    <>
      <header
        style={{
          padding: "8px 24px",
          borderBottom: "1px solid #ddd",
          background: "#fff",
        }}
      >
        <strong>json-render · {state.mode} suite</strong>
        <p>
          {state.status} · {state.completed ?? 0}/{state.total ?? 0} trials ·
          charged/reserved ${Number(state.used ?? 0).toFixed(4)}
        </p>
        {state.status === "ready" && (
          <button
            className="ui-button primary"
            onClick={() => void fetch("/start", { method: "POST" })}
          >
            Run suite
          </button>
        )}

      </header>
      <Stage />
      <footer style={{ padding: 24 }}>
        {state.result && (
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(state.result, null, 2)}
          </pre>
        )}
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Bench />);

const style = document.createElement("style");
style.textContent = "* { font-family: system-ui, sans-serif !important; } .variant-controls { display: none; }";
document.head.append(style);
