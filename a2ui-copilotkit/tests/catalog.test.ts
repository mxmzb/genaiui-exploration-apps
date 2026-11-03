import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { exportA2UICatalog } from "@copilotkit/react-core/v2/generative-ui";
import { apartmentUI } from "../src/lib/catalog";
import { formatMetric } from "../src/lib/format-metric";
import { GenerationRunning } from "../src/lib/generation-state";

test("the portable A2UI catalog retains native bindings, repeated slots and form events", () => {
  const exported = exportA2UICatalog(apartmentUI);
  assert.equal(Object.keys(exported.components).length, 18);
  assert.match(
    JSON.stringify(exported.components.Metric),
    /common_types.json#\/\$defs\/DataBinding/,
  );
  assert.match(
    JSON.stringify(exported.components.Grid),
    /common_types.json#\/\$defs\/ChildList/,
  );
  assert.match(
    JSON.stringify(exported.components.Form),
    /common_types.json#\/\$defs\/Action/,
  );
});

test("a Card is an empty container: the model must generate its content and actions", () => {
  const Card = apartmentUI.components.get("Card")!.component;
  const html = renderToStaticMarkup(createElement(Card, { recordId: "7" }));
  assert.match(html, /data-record-id="7"/);
  assert.doesNotMatch(html, /button|form|img|View Details|Schedule Tour/);
});

test("money is formatted from numbers; unknown fees cannot become a zero-dollar total", () => {
  assert.equal(formatMetric(3165, "usd/month"), "$3,165/mo");
  assert.equal(formatMetric(0, "usd"), "$0");
  assert.equal(formatMetric(null, "usd/month"), "Unknown");
  assert.equal(formatMetric(undefined, "usd/month"), "Unavailable");
  assert.equal(formatMetric("{@path:rent}", "usd/month"), "Unavailable");
  assert.equal(formatMetric("${/rent}", "usd/month"), "Unavailable");
});

test("conditional sections hide their entire subtree, without hiding known zero values", () => {
  const Stack = apartmentUI.components.get("Stack")!.component;
  assert.equal(
    renderToStaticMarkup(
      createElement(Stack, { visible: false }, "Unknown fees"),
    ),
    "",
  );
  assert.match(
    renderToStaticMarkup(
      createElement(Stack, { visible: true }, "Known subtotal: $0"),
    ),
    /Known subtotal: \$0/,
  );
});

test("streaming fields distinguish pending, absent-at-finish and known unknown values", () => {
  const Metric = apartmentUI.components.get("Metric")!.component;
  const render = (running: boolean, value: number | null | undefined) =>
    renderToStaticMarkup(
      createElement(
        GenerationRunning.Provider,
        { value: running },
        createElement(Metric, {
          label: "Monthly total",
          value,
          format: "usd/month",
        }),
      ),
    );
  assert.match(render(true, undefined), /Loading…/);
  assert.match(render(false, undefined), /Unavailable/);
  assert.match(render(true, null), /Unknown/);
  assert.doesNotMatch(render(true, null), /data-pending/);
  assert.match(render(true, 0), /\$0\/mo/);
});
