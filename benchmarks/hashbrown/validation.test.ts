import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fixture } from "./fixtures.ts";
import { validate, checkActionBindings } from "./validate.ts";
const dataset = JSON.parse(readFileSync("v3/dataset.json", "utf8"));
const cases = JSON.parse(readFileSync("v3/cases.json", "utf8"));
for (const id of ["C02", "C03"]) test(`${id}: native JSON schema and record-scoped actions`, () => {
  const taskCase = cases.generation.find((c: any) => c.id === id);
  const task = { case: taskCase, records: taskCase.input_ids.map((id: string) => dataset.records.find((r: any) => r.id === id)) };
  const valid = validate(fixture(task)); assert.equal(valid.contract.pass, true, valid.contract.errors.join("\n")); assert.equal(checkActionBindings(valid.operations, task).pass, true);
  for (const control of ["invalid-component", "truncated"]) assert.equal(validate(fixture(task, control)).contract.pass, false);
  assert.equal(checkActionBindings(validate(fixture(task, "wrong-action")).operations, task).pass, false);
});
