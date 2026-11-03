import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  useAgent,
  useCopilotKit,
} from "../../hashbrown-copilotkit/node_modules/@copilotkit/react-core/dist/v2/index.mjs";
import { ApartmentFinder } from "../../hashbrown-copilotkit/src/components/ApartmentFinder.tsx";
import { Observer } from "../common/Observer";
import "../../hashbrown-copilotkit/src/styles.css";

import { Stage, inStage } from "../common/Stage";

function AgentObserver({ trial }: { trial: any }) {
  const { agent, isReady } = useAgent();
  const { copilotkit } = useCopilotKit();
  return <Observer trial={trial} agent={agent} isReady={isReady} copilotkit={copilotkit} />;
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
    <ApartmentFinder key={state.trial.id} runtimeUrl={`/runtime/${state.trial.id}`}><AgentObserver trial={state.trial} /></ApartmentFinder>
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
        <strong>Hashbrown · {state.mode} suite</strong>
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
