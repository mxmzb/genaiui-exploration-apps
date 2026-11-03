import { useEffect, useState, type ReactNode } from "react";
import { useUiKit, useJsonParser } from "@hashbrownai/react";
import { apartmentComponents, ActionContext } from "../lib/components";
import { navigationAction, type UIAction } from "../lib/catalog";
import { GenerationRunning } from "../lib/generation-state";
import { Composer, Loading, Welcome, requestLabel } from "./FinderUI";
export function actionMessage(action: UIAction) {
  if (action.name !== "submit_tour") navigationAction.validate(action);
  const labels = { view_apartment: "Show apartment details", schedule_tour: "Open a demo tour request", back_to_results: "Return to my previous results, preserving my search filters", compare_apartments: "Compare these apartments", submit_tour: "Confirm my demo request. No booking is made or message sent" };
  return `${labels[action.name]}\n${JSON.stringify(action)}`;
}
export function HashbrownView({ response, busy, onDiagnostics }: { response: string | null; busy: boolean; onDiagnostics?: (errors: string[]) => void }) {
  const kit = useUiKit({ components: apartmentComponents });
  const { value, error } = useJsonParser(response ?? "", kit.schema);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    let problem = "";
    if (response && !busy) {
      try { kit.schema.validate(JSON.parse(response)); } catch (e) { problem = String(e); }
      if (error) problem ||= String(error);
    }
    setFailure(problem); onDiagnostics?.(problem ? [problem] : []);
  }, [response, busy, error, onDiagnostics, kit.schema]);
  return <>{value && kit.render(value)}{failure && <p className="error-notice" role="alert">Some parts of this view could not be generated. Please try again.</p>}</>;
}
export function Workspace({ response, rendered, request, busy, error, send, reset, onDiagnostics }: {
  response?: string | null; rendered?: ReactNode; request: string; busy: boolean; error?: string;
  send: (text: string) => Promise<void>; reset: () => void; onDiagnostics?: (errors: string[]) => void;
}) {
  const [actionError, setActionError] = useState("");
  return <GenerationRunning value={busy}><ActionContext value={action => {
    if (busy) return;
    try { setActionError(""); void send(actionMessage(action)); } catch (e) { setActionError(String(e)); }
  }}><main className={`finder ${request ? "has-messages" : ""}`}>
    <Composer send={send} busy={busy} />
    {request && <div className="results-toolbar"><div><p className="eyebrow">Your apartment search</p><p className="search-summary">{requestLabel(request.split("\n")[0])}</p></div><button className="text-button" onClick={reset} disabled={busy}>↺ Start fresh</button></div>}
    <div className="finder-content">
      {!request && <Welcome send={send} busy={busy} />}
      <fieldset className="surface-controls generated-ui" disabled={busy} aria-label="Apartment results" aria-busy={busy}>
        {rendered ?? <HashbrownView response={response ?? null} busy={busy} onDiagnostics={onDiagnostics} />}
      </fieldset>
      {busy && <Loading />}
      {(error || actionError) && <div className="error-notice" role="alert"><strong>We couldn’t finish that view.</strong><p>{error || actionError}</p><button className="text-button" disabled={busy} onClick={() => { setActionError(""); void send(request); }}>Try again ↗</button></div>}
    </div>
  </main></ActionContext></GenerationRunning>;
}
