import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fixture } from "./fixtures.ts";
import { validate } from "./validate.ts";
import { checkActionBindings } from "./actions.ts";
import { Ledger } from "./transport.ts";
import { variants } from "../../a2ui-copilotkit/src/lib/variants.ts";
import { RenderUIArgsStream } from "../../a2ui-copilotkit/node_modules/@copilotkit/shared/dist/index.mjs";
const dataset = JSON.parse(await readFile("v2/dataset.json", "utf8"));
const cases = JSON.parse(
  await readFile("v2/cases.json", "utf8"),
).generation.filter((c: any) => ["C02", "C03"].includes(c.id));
const tasks = cases.map((c: any) => ({
  case: c,
  records: c.input_ids.map((id: string) =>
    dataset.records.find((r: any) => r.id === id),
  ),
}));
test("all 16 fixtures satisfy the native contract, strategy and scoped action oracle", () => {
  for (const task of tasks)
    for (const variant of variants) {
      const f = fixture(task, variant),
        v = validate(f.raw, variant);
      assert.deepEqual(v.contract.errors, []);
      assert.deepEqual(v.strategy.errors, []);
      assert.deepEqual(checkActionBindings(v.operations, task).errors, []);
    }
});
test("wrong IDs, invented components, truncation and a mislabeled strategy are rejected", () => {
  const variant = { transport: "tool", generation: "batch" } as const,
    task = tasks[0];
  assert.equal(
    checkActionBindings(fixture(task, variant, "wrong-action").operations, task)
      .pass,
    false,
  );
  assert.equal(
    validate(fixture(task, variant, "invalid-component").raw, variant).contract
      .pass,
    false,
  );
  assert.equal(
    validate(fixture(task, variant, "truncated").raw, variant).contract.pass,
    false,
  );
  assert.equal(
    validate(fixture(task, variant).raw, { ...variant, generation: "fields" })
      .strategy.pass,
    false,
  );
});
test("native tool parser withholds incomplete operations and emits completed ones once", () => {
  const f = fixture(tasks[0], { transport: "tool", generation: "components" }),
    parser = new RenderUIArgsStream();
  const prefix = JSON.stringify({
    target: "apartments",
    operations: [f.operations[0]],
  }).slice(0, -2);
  assert.equal(parser.push(prefix).newOperations.length, 1);
  const next = JSON.stringify(f.operations[1]);
  assert.equal(parser.push("," + next.slice(0, -1)).newOperations.length, 0);
  assert.equal(parser.push(next.slice(-1)).newOperations.length, 1);
  assert.equal(parser.push("").newOperations.length, 0);
});
test("budget reservations survive restart; unknown usage stays reserved and cap stops next call", async () => {
  const dir = await mkdtemp(join(tmpdir(), "a2ui-budget-"));
  try {
    const path = join(dir, "ledger.json"),
      a = new Ledger(path, 1);
    await a.load();
    await a.reserve("one", 0.8);
    await a.settle("one", undefined);
    const b = new Ledger(path, 1);
    await b.load();
    assert.equal(b.used, 0.8);
    await assert.rejects(() => b.reserve("two", 0.3));
    await b.settle("one", 0.1);
    await b.reserve("two", 0.3);
    assert.equal(b.used, 0.4);
    await assert.rejects(() => b.reserve("two", 0.1));
  } finally {
    await rm(dir, { recursive: true });
  }
});

test("Markdown raw JSON validity stays separate from native parser recovery", () => {
  const variant = { transport: "markdown", generation: "fields" } as const;
  const raw = fixture(tasks[0], variant)
    .raw.split("\n")
    .map((line) =>
      line.includes('"path":"/apartments/0",') ? line.slice(0, -1) : line,
    )
    .join("\n");
  const parsed = validate(raw, variant);
  assert.equal(parsed.rawFormat.pass, false);
  assert.equal(parsed.contract.pass, true);
  assert.equal(parsed.strategy.pass, true);
  assert.equal(checkActionBindings(parsed.operations, tasks[0]).pass, true);
  assert.ok(parsed.recovery.invalidLines.length > 0);
});

test("template setup can span createSurface and updateComponents before data starts", () => {
  const variant = { transport: "tool", generation: "fields" } as const;
  const f = fixture(tasks[0], variant);
  const first = f.operations[0].createSurface;
  const rest = first.components.splice(1);
  f.operations.splice(1, 0, { updateComponents: { surfaceId: first.surfaceId, components: rest } });
  assert.equal(validate(JSON.stringify({target: "apartments", operations: f.operations}), variant).strategy.pass, true);
  f.operations.push(f.operations[1]);
  assert.equal(validate(JSON.stringify({target: "apartments", operations: f.operations}), variant).strategy.pass, false);
});
