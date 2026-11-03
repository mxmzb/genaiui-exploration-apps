import { useCallback, useState } from "react";
import { Renderer, type OpenUIError, type LibraryActionEvent } from "@openuidev/react-lang";
import { apartmentLibrary, actions } from "../lib/catalog";
import { GenerationRunning } from "../lib/generation-state";
import { Composer, Loading, Welcome, requestLabel } from "./FinderUI";

export function actionMessage(event: LibraryActionEvent<typeof apartmentLibrary>) {
  const definition = actions.find(action => action.name === event.type);
  if (!definition) throw Error(`Unknown action: ${event.type}`);
  const parsed = definition.params.safeParse(event.params ?? {});
  if (!parsed.success) throw Error("The generated action has invalid parameters. Please try your search again.");
  const label: Record<string, string> = {
    view_apartment: "Show apartment details", schedule_tour: "Open a demo tour request",
    back_to_results: "Return to my previous results, preserving my search filters",
    compare_apartments: "Compare these apartments", submit_tour: "Confirm my demo request. No booking is made or message sent",
  };
  return `${label[event.type]}\n${JSON.stringify({ action: event.type, ...parsed.data })}`;
}

export function Workspace({ response, request, busy, error, send, reset, onDiagnostics }: {
  response: string | null; request: string; busy: boolean; error?: string;
  send: (text: string) => Promise<void>; reset: () => void;
  onDiagnostics?: (errors: OpenUIError[]) => void;
}) {
  const [diagnostics, setDiagnostics] = useState<OpenUIError[]>([]);
  const [actionError, setActionError] = useState("");
  const report = useCallback((errors: OpenUIError[]) => {
    setDiagnostics(old => JSON.stringify(old) === JSON.stringify(errors) ? old : errors);
    onDiagnostics?.(errors);
  }, [onDiagnostics]);
  const failures = busy ? [] : diagnostics.filter(e => e.severity !== "warning");
  const problem = error || actionError || (failures.length ? "Some parts of this view could not be generated. You can try the request again." : "");
  return <GenerationRunning value={busy}>
    <main className={`finder ${request ? "has-messages" : ""}`}>
      <Composer send={send} busy={busy} />
      {request && <div className="results-toolbar"><div><p className="eyebrow">Your apartment search</p><p className="search-summary">{requestLabel(request.split("\n")[0])}</p></div><button className="text-button" onClick={reset} disabled={busy}>↺ Start fresh</button></div>}
      <div className="finder-content">
        {!request && <Welcome send={send} busy={busy} />}
        <fieldset className="surface-controls generated-ui" disabled={busy} aria-label="Apartment results" aria-busy={busy}>
          <Renderer response={response} library={apartmentLibrary} isStreaming={busy} onError={report} onAction={event => {
            if (busy) return;
            try { setActionError(""); void send(actionMessage(event)); } catch (e) { setActionError(String(e)); }
          }} />
        </fieldset>
        {busy && <Loading />}
        {problem && <div className="error-notice" role="alert"><strong>We couldn’t finish that view.</strong><p>{problem}</p><button className="text-button" disabled={busy} onClick={() => { setActionError(""); void send(request); }}>Try again ↗</button></div>}
      </div>
    </main>
  </GenerationRunning>;
}
