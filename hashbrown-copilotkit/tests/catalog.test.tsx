import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { HashbrownView, Workspace } from "../src/components/Workspace";
import { ActionContext } from "../src/lib/components";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const name of ["window", "document", "HTMLElement", "HTMLInputElement", "FormData", "MutationObserver", "Event", "CustomEvent"])
  Object.defineProperty(globalThis, name, { value: (dom.window as any)[name], configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const { render, fireEvent, cleanup, waitFor } = await import("@testing-library/react");
const node = (name: string, props: object, children?: object[]) => ({ [name]: { props, ...(children ? { children } : {}) } });
const source = (...children: object[]) => JSON.stringify({ ui: [node("Stack", { gap: "md", padding: "none", visible: true }, children)] });
const button = (action: object | null, type = "button") => node("Button", { label: "Continue", variant: "primary", type, action });

test("native parser reveals nested children and streaming text before JSON closes", async () => {
  const prefix = '{"ui":[{"Stack":{"props":{"gap":"md","padding":"none","visible":true},"children":[{"Heading":{"props":{"level":"h2","text":"Finding your';
  const view = render(<HashbrownView response={prefix} busy />);
  await waitFor(() => assert.match(view.getByRole("heading").textContent ?? "", /Finding your/));
  view.rerender(<HashbrownView response={prefix + ' home"}}}]}}]}'} busy={false} />);
  await waitFor(() => assert.equal(view.getByRole("heading").textContent, "Finding your home"));
  assert.equal(view.queryByRole("alert"), null);
  cleanup();
});
test("native JSON rendering preserves action IDs and numeric money", async () => {
  const actions: any[] = [];
  const raw = source(node("Metric", { label: "Rent", value: 2800, format: "usd/month", emphasis: true }), button({ name: "view_apartment", apartmentId: "7" }));
  const view = render(<ActionContext value={a => actions.push(a)}><HashbrownView response={raw} busy={false} /></ActionContext>);
  await waitFor(() => assert.ok(view.getByText("$2,800/mo")));
  fireEvent.click(view.getByRole("button", { name: /Continue/ }));
  assert.deepEqual(actions, [{ name: "view_apartment", apartmentId: "7" }]); cleanup();
});
test("generated forms validate and submit only their own actual input values", async () => {
  const actions: any[] = [];
  const field = (name: string, label: string, value: string) => node("Input", { name, label, required: true, type: "email", placeholder: "", defaultValue: value, min: "", max: "" });
  const raw = source(node("Form", { apartmentId: "7", label: "Tour seven" }, [field("email", "Email", ""), button(null, "submit")]), node("Form", { apartmentId: "2", label: "Other form" }, [field("other", "Other", "dontleak@example.com")]));
  const view = render(<ActionContext value={a => actions.push(a)}><HashbrownView response={raw} busy={false} /></ActionContext>);
  const form = await view.findByRole("form", { name: "Tour seven" });
  fireEvent.submit(form); assert.equal(actions.length, 0);
  fireEvent.change(view.getByLabelText(/Email/), { target: { value: "reader@example.com" } });
  fireEvent.submit(form);
  assert.deepEqual(actions, [{ name: "submit_tour", apartmentId: "7", details: { email: "reader@example.com" } }]); cleanup();
});
test("busy controls cannot dispatch and malformed final JSON is visible", async () => {
  const sent: string[] = [];
  const raw = source(button({ name: "view_apartment", apartmentId: "7" }));
  const view = render(<Workspace request="Search" response={raw} busy send={async s => {sent.push(s);}} reset={() => {}} />);
  fireEvent.click(await view.findByRole("button", { name: /Continue/ })); assert.equal(sent.length, 0);
  view.rerender(<Workspace request="Search" response={raw.slice(0, -4)} busy={false} send={async () => {}} reset={() => {}} />);
  await waitFor(() => assert.ok(view.getByRole("alert"))); cleanup();
});
