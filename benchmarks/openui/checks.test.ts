import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fixture } from "./fixtures.ts";
import { validate, checkActionBindings } from "./validate.ts";
import { actionMessage } from "../../openui-copilotkit/src/components/Workspace.tsx";
const dataset = JSON.parse(await readFile("v3/dataset.json", "utf8"));
const cases = JSON.parse(await readFile("v3/cases.json", "utf8")).generation;
const tasks = cases.filter((c: any) => ["C02", "C03"].includes(c.id)).map((c: any) => ({ case: c, records: c.input_ids.map((id: string) => dataset.records.find((r: any) => r.id === id)) }));
test("OpenUI native parser and evaluator resolve both composed fixtures and scoped custom actions", () => {
  for (const task of tasks) {
    const result = validate(fixture(task));
    assert.deepEqual(result.contract.errors, []);
    assert.deepEqual(checkActionBindings(result.operations, task).errors, []);
  }
});
test("OpenUI wrong-record actions, unknown components and unresolved references fail independently", () => {
  assert.equal(checkActionBindings(validate(fixture(tasks[0], "wrong-action")).operations, tasks[0]).pass, false);
  assert.equal(validate(fixture(tasks[0], "invalid-component")).contract.pass, false);
  assert.equal(validate(fixture(tasks[0], "truncated")).contract.pass, false);
});
test("Only declared actions with validated parameters become model requests", () => {
  assert.throws(() => actionMessage({ type: "schedule_tour", params: {} } as any));
  assert.throws(() => actionMessage({ type: "open_url", params: { url: "https://example.com" } } as any));
  assert.match(actionMessage({ type: "view_apartment", params: { apartmentId: "7" } } as any), /"apartmentId":"7"/);
});
