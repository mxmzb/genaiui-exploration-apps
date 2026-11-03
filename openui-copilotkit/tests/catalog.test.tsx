import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { Renderer } from "@openuidev/react-lang";
import { apartmentLibrary } from "../src/lib/catalog";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
for (const name of ["window", "document", "HTMLElement", "HTMLInputElement", "FormData", "MutationObserver", "Event", "CustomEvent"])
  Object.defineProperty(globalThis, name, { value: (dom.window as any)[name], configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const { render, fireEvent, cleanup, waitFor } = await import("@testing-library/react");

test("native custom action dispatch preserves the generated record ID", async () => {
  const events: any[] = [];
  const view = render(<Renderer library={apartmentLibrary} response={'root = Stack("md", "none", true, [Button("View Details", "primary", "button", @view_apartment("7"))]);'} onAction={e => events.push(e)} />);
  fireEvent.click(view.getByRole("button", { name: /View Details/ }));
  await waitFor(() => assert.equal(events.length, 1));
  assert.equal(events[0].type, "view_apartment");
  assert.deepEqual(events[0].params, { apartmentId: "7" });
  cleanup();
});
test("generated forms enforce required fields and submit only their own actual values", async () => {
  const events: any[] = [];
  const field = 'Input("email", "Email", true, "email", "", "", null, null)';
  const source = `root = Stack("md", "none", true, [Form("7", "Tour seven", [${field}, Button("Send request", "primary", "submit")]), Form("2", "Other form", [Input("other", "Unrelated", false, "text", "", "must not leak")])]);`;
  const view = render(<Renderer library={apartmentLibrary} response={source} onAction={e => events.push(e)} />);
  const form = view.getByRole("form", { name: "Tour seven" });
  fireEvent.submit(form);
  assert.equal(events.length, 0);
  fireEvent.change(view.getByLabelText(/Email/), { target: { value: "reader@example.com" } });
  fireEvent.submit(form);
  await waitFor(() => assert.equal(events.length, 1));
  assert.equal(events[0].type, "submit_tour");
  assert.deepEqual(events[0].params, { apartmentId: "7", details: { email: "reader@example.com" } });
  cleanup();
});
