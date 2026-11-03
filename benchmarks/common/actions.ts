// Browser-side interaction checks. Click actual DOM controls and inspect the
// requests received by the app endpoint; never dispatch a synthetic named action.
export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
export async function until(check: () => boolean, message: string, timeout = 3000) {
  const deadline = performance.now() + timeout;
  while (!check()) { if (performance.now() > deadline) throw Error(message); await wait(20); }
}
export function setField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  const proto = field instanceof HTMLSelectElement ? HTMLSelectElement.prototype : field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}
const labels: Record<string, RegExp> = { view_apartment: /view details/i, schedule_tour: /schedule tour/i, back_to_results: /back to results/i, submit_tour: /submit.*(?:demo|request)|send.*request/i };
export async function exerciseActions(trial: any, restore: () => Promise<void>) {
  const errors: string[] = [], checks: any[] = [];
  const requests = async () => (await fetch(`/actions/${trial.id}`).then(r => r.json())).requests;
  const root = () => document.querySelector(".generated-ui")!;
  const getButton = (name: string, id?: string): HTMLButtonElement | undefined => {
    const title = trial.task.records.find((r: any) => r.id === id)?.title;
    const heading = [...root().querySelectorAll("h2,h3,h4")].find(n => n.textContent?.trim() === title);
    const scope = id && trial.task.records.length > 1 ? heading?.closest(".ui-card") : root();
    return [...(scope?.querySelectorAll("button") ?? [])].find(n => labels[name]?.test(n.textContent ?? "")) as HTMLButtonElement | undefined;
  };
  async function attempt(name: string, id: string | undefined, button: HTMLButtonElement | undefined, expectedDetails?: any) {
    const before = (await requests()).length;
    const check: any = { name, apartmentId: id, before, errors: [] };
    if (!button || !button.isConnected || button.matches(":disabled") || !button.getClientRects().length) check.errors.push("Missing, hidden or disabled control");
    else {
      button.click();
      let received: any[] = [];
      for (let i = 0; i < 50; i++) { received = (await requests()).slice(before); if (received.length) break; await wait(20); }
      await wait(100); received = (await requests()).slice(before); // catch duplicate submissions
      check.received = received;
      if (received.length !== 1) check.errors.push(`Expected one request, received ${received.length}`);
      const action = received[0]?.action;
      if (!action || action.name !== name || action.apartmentId !== id) check.errors.push("Wrong action or record reached the server");
      if (expectedDetails && JSON.stringify(Object.entries(action?.details ?? {}).sort()) !== JSON.stringify(Object.entries(expectedDetails).sort())) check.errors.push("Submitted values differ from the entered, form-scoped values");
    }
    checks.push(check); errors.push(...check.errors.map((e: string) => `${name}:${id ?? "results"}: ${e}`));
  }
  // Capture controls before the first action replaces the latest message/view.
  for (const name of trial.task.case.expected.actions.filter((a: string) => a !== "submit_tour")) {
    for (const id of name === "back_to_results" ? [undefined] : trial.task.case.expected.listing_ids) {
      await restore(); await attempt(name, id, getButton(name, id));
    }
  }
  if (trial.task.case.expected.form) {
    const values: Record<string,string> = { name: "Benchmark Reader", email: "reader@example.com", date: "2026-11-14", phone: "555-0107", tourType: "video", message: "A demonstration request." };
    await restore();
    const form = root().querySelector("form");
    const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
    const field = (name: string) => form?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (!form || !submit || Object.keys(values).some(name => !field(name))) errors.push("Cannot exercise incomplete generated form");
    else {
      const fill = () => Object.entries(values).forEach(([name,value]) => setField(field(name)!, value));
      for (const [name, invalid] of [...trial.task.case.expected.form.required.map((n: string) => [n, ""]), ["email", "not-an-email"], ["date", "2026-11-01"]]) {
        fill(); setField(field(name)!, invalid);
        const before = (await requests()).length; submit.click(); await wait(100);
        const delta = (await requests()).length - before;
        checks.push({ name: "invalid_submit", field: name, value: invalid, requests: delta });
        if (delta) { errors.push(`Invalid ${name} submission reached the server`); await restore(); break; }
      }
      // A field outside the generated form catches accidental global input collection.
      const decoy = document.createElement("input"); decoy.name = "outsideForm"; decoy.value = "must-not-leak"; document.body.append(decoy);
      for (const checked of [false, true]) {
        await restore();
        const active = root().querySelector("form")!;
        Object.entries(values).forEach(([name,value]) => setField(active.elements.namedItem(name) as HTMLInputElement, value));
        const checkbox = active.elements.namedItem("bringPet") as HTMLInputElement | null;
        if (checkbox && checkbox.checked !== checked) checkbox.click();
        await attempt("submit_tour", trial.task.case.expected.listing_ids[0], active.querySelector<HTMLButtonElement>('button[type="submit"]') ?? undefined, { ...values, ...(checked ? { bringPet: "on" } : {}) });
      }
      decoy.remove();
    }
  }
  if (!trial.task.case.expected.actions.length && (await requests()).length) errors.push("Unexpected action request in empty state");
  await restore();
  return { pass: !errors.length, errors, checks, requestCount: (await requests()).length };
}
