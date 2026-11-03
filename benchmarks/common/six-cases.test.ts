import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fixture as a2uiFixture } from "../a2ui/fixtures.ts";
import { fixture as openuiFixture } from "../openui/fixtures.ts";
import { fixture as hashbrownFixture } from "../hashbrown/fixtures.ts";
import { fixture as jsonFixture } from "../json-render/shared-fixtures.ts";
import { validate as a2uiValidate } from "../a2ui/validate.ts";
import { validate as openuiValidate } from "../openui/validate.ts";
import { validate as hashbrownValidate } from "../hashbrown/validate.ts";
import { validateOutput as jsonValidate } from "../json-render/validate.ts";
import { checkEmptyView, checkRecord } from "../json-render/observe.ts";
import { actionRequest } from "./action-request.ts";
const dataset = JSON.parse(readFileSync("v4/dataset.json", "utf8"));
const cases = JSON.parse(readFileSync("v4/cases.json", "utf8"));
export const tasks = cases.generation.map((c: any) => ({ case: c, records: c.input_ids.map((id: string) => dataset.records.find((r: any) => r.id === id)), otherRecords: dataset.records.filter((r: any) => !c.input_ids.includes(r.id)) }));
for (const framework of ["a2ui", "openui", "hashbrown", "json-render"]) test(`${framework}: all six replay fixtures satisfy the native contract`, () => {
  for (const task of tasks) {
    const variant = { transport: "tool", generation: "batch" } as const;
    const result = framework === "a2ui" ? a2uiValidate(a2uiFixture(task, variant).raw, variant) : framework === "openui" ? openuiValidate(openuiFixture(task)) : framework === "hashbrown" ? hashbrownValidate(hashbrownFixture(task)) : jsonValidate(jsonFixture(task));
    assert.equal(result.contract.pass, true, `${task.case.id}: ${result.contract.errors.join("\n")}`);
  }
});
test("empty-state oracle rejects silence, wrong budget and invented controls", () => {
  assert.deepEqual(checkEmptyView("No matching apartments below $1,000. Increase your budget.", []), []);
  for (const [text, buttons] of [["", []], ["No matching apartments below $2,000. Increase your budget.", []], ["No matching apartments below $1,000. Increase your budget.", [{}]]]) assert.ok(checkEmptyView(text as string, buttons as any[]).length);
});
test("form identity is graded without requiring listing-only photos and prices", () => {
  const record = tasks.find((t: any) => t.case.id === "C06").records[0];
  assert.deepEqual(checkRecord(record, { text: record.title, metrics: [], images: [] }, ["id", "title"]), []);
  assert.ok(checkRecord(record, { text: "Wrong apartment", metrics: [], images: [] }, ["id", "title"]).length);
});
test("server evidence normalizes real action payloads without expected values", () => {
  const body = (content: string) => ({ messages: [{ role: "user", content }] });
  assert.deepEqual(actionRequest(body('Show details\n{"action":"view_apartment","apartmentId":"7"}'), "openui").action, { name: "view_apartment", apartmentId: "7" });
  assert.deepEqual(actionRequest(body('Show details\n{"name":"view_apartment","apartmentId":"999"}'), "hashbrown").action, { name: "view_apartment", apartmentId: "999" });
  assert.deepEqual(actionRequest(body('Confirm my demo tour request for apartment 7. Details: {"email":"reader@example.com"}'), "json-render").action, { name: "submit_tour", apartmentId: "7", details: { email: "reader@example.com" } });
  assert.equal(actionRequest(body("Unrecognized request"), "json-render").action, null);
  assert.deepEqual(actionRequest({ forwardedProps: { copilotkit: { ui: { metadata: { extensions: { copilotkit_action: { action: { name: "schedule_tour", context: { apartmentId: "2" } } } } } } } } }, "a2ui").action, { name: "schedule_tour", apartmentId: "2" });
});
