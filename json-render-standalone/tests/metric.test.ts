import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveElementProps, resolveActionParam } from "@json-render/core";
import { formatMetric } from "../src/lib/format-metric.ts";
import { formatMetric as formatCopilotMetric } from "../../json-render-copilotkit/src/lib/format-metric.ts";

test("native repeat bindings preserve each record's numeric prices and action ID", () => {
  const apartments = [
    { id: "3", rent: 1450, costs: { monthlyTotal: 1530 } },
    { id: "12", rent: 1725, costs: { monthlyTotal: null } },
  ];
  for (const [index, apartment] of apartments.entries()) {
    const context = {
      stateModel: { apartments },
      repeatItem: apartment,
      repeatIndex: index,
      repeatBasePath: `/apartments/${index}`,
    };
    const props = resolveElementProps(
      { rent: { $item: "rent" }, total: { $item: "costs/monthlyTotal" } },
      context,
    );
    assert.equal(props.rent, apartment.rent);
    assert.equal(props.total, apartment.costs.monthlyTotal);
    // In json-render 0.21, bare $item action params resolve to a path, not a value.
    assert.equal(
      resolveActionParam({ $template: "${id}" }, context),
      apartment.id,
    );
    assert.equal(
      resolveActionParam({ $item: "id" }, context),
      `/apartments/${index}/id`,
    );
  }
});

test("both renderers format numeric metrics without template interpolation", () => {
  for (const format of [formatMetric, formatCopilotMetric]) {
    assert.equal(format(1530, "usd/month"), "$1,530/mo");
    assert.equal(format(1725, "usd"), "$1,725");
    assert.equal(format(1100, "sqft"), "1,100 sqft");
    assert.equal(format(0, "usd/month"), "$0/mo");
    assert.equal(format(null, "usd/month"), "Unknown");
    assert.equal(format(undefined, "usd/month"), "Unavailable");
    assert.equal(format("$/rent}/mo", "usd/month"), "Unavailable");
    assert.equal(format("$/rent}/mo"), "Unavailable");
    assert.equal(format("${costs.monthlyTotal}/mo"), "Unavailable");
    assert.equal(format("12 months"), "12 months");
  }
});
