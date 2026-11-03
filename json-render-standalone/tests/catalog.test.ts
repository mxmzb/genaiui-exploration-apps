import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { catalog } from "../src/lib/catalog.ts";
import { calculateCosts } from "../../db/pricing.ts";

test("controlled views exercise only valid granular components and connected trees", () => {
  for (const task of [
    "list",
    "compare",
    "detail",
    "tour video phone required",
    "two independent forms",
    "twelve",
    "empty",
    "confirm",
  ]) {
    const spec = JSON.parse(
      execFileSync("python3", ["tests/fixture_views.py", task], {
        encoding: "utf8",
      }),
    );
    assert.equal(catalog.validate(spec).success, true, task);
    const visited = new Set<string>();
    function visit(id: string) {
      assert.ok(!visited.has(id), `${task}: cycle or reused node ${id}`);
      visited.add(id);
      const element = spec.elements[id];
      assert.ok(element, `${task}: missing child ${id}`);
      const component =
        catalog.data.components[
          element.type as keyof typeof catalog.data.components
        ];
      assert.ok(component, `${task}: unknown component ${element.type}`);
      const props = component.props.safeParse(element.props);
      assert.equal(
        props.success,
        true,
        `${task}: ${element.type} ${JSON.stringify(props)}`,
      );
      for (const child of element.children ?? []) visit(child);
    }
    visit(spec.root);
    assert.equal(
      visited.size,
      Object.keys(spec.elements).length,
      `${task}: unreachable nodes`,
    );
  }
});

test("optional fees stay outside mandatory costs and unknown fees stay unknown", () => {
  const fees = [
    { label: "Service fee", amount: 65, frequency: "monthly", required: true },
    { label: "Parking", amount: 200, frequency: "monthly", required: false },
    { label: "Deposit", amount: 3100, frequency: "once", required: true },
  ];
  assert.equal(calculateCosts(3100, fees).monthlyTotal, 3165);
  assert.equal(calculateCosts(3100, fees).moveInTotal, 6265);
  const unknown = calculateCosts(3100, [
    { ...fees[0], amount: null },
    ...fees.slice(1),
  ]);
  assert.equal(unknown.monthlyTotal, null);
  assert.equal(unknown.moveInTotal, null);
  assert.equal(unknown.knownMonthlySubtotal, 3100);
  const unknownDeposit = calculateCosts(3100, [
    fees[0],
    { ...fees[2], amount: null },
  ]);
  assert.equal(unknownDeposit.monthlyTotal, 3165);
  assert.equal(unknownDeposit.moveInTotal, null);
});
