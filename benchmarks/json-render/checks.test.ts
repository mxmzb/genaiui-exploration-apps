import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { reserveCost, Budget } from "./budget.ts";
import { validateOutput, checkActions } from "./validate.ts";
import { fixture } from "./fixtures.ts";
import { checkRecord } from "./observe.ts";
const cases = JSON.parse(readFileSync("v2/cases.json", "utf8")).generation;
const records = JSON.parse(readFileSync("v2/dataset.json", "utf8")).records;
for (const id of ["C01", "C02", "C04"]) test(`${id}: catalog accepts a composed repeat with real bindings`, () => {
  const c = cases.find((c: any) => c.id === id);
  const task = { case: c, records: c.input_ids.map((id: string) => records.find((r: any) => r.id === id)) };
  const valid = validateOutput(fixture(task).join("\n"));
  assert.deepEqual(valid.rawFormat.errors, []);
  assert.deepEqual(valid.contract.errors, []);
  const broken = validateOutput(fixture(task, "malformed").join("\n"));
  assert.equal(broken.rawFormat.pass, false);
  const lines = fixture(task).map((line) => JSON.parse(line));
  lines.find((patch) => patch.path === "/elements/title").value.props.text = 42;
  const wrongType = validateOutput(lines.map((line) => JSON.stringify(line)).join("\n"));
  assert.equal(wrongType.contract.pass, false);
  assert.ok(wrongType.contract.errors.some((error) => error.startsWith("title:")));
});
test("unknown prices block spending, unknown cost keeps its reservation", () => {
  assert.throws(() => reserveCost(200, 100, { prompt: null, completion: "0.01" }));
  assert.throws(() => reserveCost(200, 100, {}));
  const budget = new Budget(1);
  budget.reserve(0.7); budget.settle(0.7, null);
  assert.equal(budget.used, 0.7);
  assert.throws(() => budget.reserve(0.4));
  budget.settle(0.7, 0.2); budget.reserve(0.7);
  assert.ok(budget.used < 1);
});
test("a valid target on the wrong card still fails", () => {
  const c = cases.find((c: any) => c.id === "C01");
  const clicks = c.expected.actions.map((name: string) => ({ label: name, scopeId: "7", events: [{ name, params: { apartmentId: "2" } }] }));
  assert.equal(checkActions(c, clicks).pass, false);
});
test("fee amounts stay associated with their label; equivalent wording is allowed", () => {
  const record = records.find((r: any) => r.id === "2");
  const actual = (fees: string) => ({ text: `${record.title}\n${record.neighborhood}\n${fees}`, images: [{ src: record.imageUrl }], metrics: [
    { label: "Base rent", value: "3100" }, { label: "Monthly total", value: "3165" },
    { label: "Bedrooms", value: "2" }, { label: "Bathrooms", value: "2" }, { label: "Area", value: "1100" },
  ] });
  assert.equal(checkRecord(record, actual("Building services: $999\nOptional parking: $65"), ["fees"]).some((e) => e.includes("Building services")), true);
  assert.deepEqual(checkRecord(record, actual("Building services (Required, monthly)\n$65/mo"), ["fees"]), []);
});
