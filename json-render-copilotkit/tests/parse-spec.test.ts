import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSpec } from "../src/lib/parse-spec";

test("retains the return button when the model omits a final closing brace", () => {
  const prefix = [
    '{"op":"add","path":"/root","value":"detail"}',
    '{"op":"add","path":"/elements/detail","value":{"type":"DetailView","props":{"title":"Apartment"},"children":["detail-back"]}}',
  ].join("\n");
  // Final line captured from a live generation, missing its last closing brace.
  const broken =
    '{"op":"add","path":"/elements/detail-back","value":{"type":"Button","props":{"label":"Back to Results","variant":"secondary"},"on":{"press":{"action":"back_to_results","params":{}}},"children":[]}';
  const repaired = parseSpec(`${prefix}\n${broken}`);
  assert.deepEqual(repaired, parseSpec(`${prefix}\n${broken}}`));
  assert.equal(
    repaired?.elements["detail-back"]?.props.label,
    "Back to Results",
  );
});

test("ordinary assistant text does not become an interface", () => {
  assert.equal(parseSpec("Here are your apartments."), null);
});

test("does not apply an incomplete patch while the agent is streaming", () => {
  const incomplete = '{"op":"add","path":';
  assert.equal(parseSpec(incomplete, false), null);
  assert.equal(parseSpec(incomplete), null);
});
