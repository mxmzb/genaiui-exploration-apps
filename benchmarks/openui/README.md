# OpenUI × Promptfoo

Uses the real `openui-copilotkit` runtime, native OpenUI Lang renderer, custom
18-component catalog and browser workspace. CopilotKit handles conversation and
streaming; no A2UI surface or tool wrapper replaces OpenUI's native format.

## Run

From `benchmarks/`, on Node 24.20+ with both OpenUI packages installed:

```sh
pnpm openui --mode replay --port 15502
pnpm openui --mode plan
pnpm openui --mode live --max-spend-usd 30 --port 15503
```

Open the printed browser URL and click **Run suite**. Keep the tab available until
completion. Results go into `results/openui-<timestamp>-<mode>/` and Promptfoo's
existing `.promptfoo` database. `pnpm exec promptfoo view --port 15500 --no` opens
the viewer; set `PROMPTFOO_CONFIG_DIR` to this directory's `.promptfoo` when starting
it from elsewhere. `pnpm test` covers native parser/action negative controls.

The default suite covers all six v4 cases and eleven negative controls, including
detail fees, empty states, dead buttons and invalid/misdirected forms. Actual
clicks and form submissions are checked at the server. See the [shared suite](../SIX_CASES.md).
`--cases C03 --skip-controls` runs just that valid replay. The earlier live pilot
covered only C02/C03 under v3; it is not a six-case model result. A negative control
passes only when the intended independent check rejects it.

No retries or repair services. Native parser metadata is saved; OpenUI's
`rawFormat` field currently means native parse acceptance, not an independent
strict language validator. Actions are checked using the native evaluator and
scoped record IDs. DOM checks use the independent fixture facts. Native warnings
remain diagnostics; errors make the contract/runtime fail.

See [measurement definitions and limits](../MEASUREMENTS.md),
[initial live results](PILOT-2026-11-02.md), and [helper-package research](HELPERS.md).
The benchmark currently covers the CopilotKit orchestration path. The standalone
headless-chat example shares its catalog and visual workspace but is not a separate
ranked benchmark variant. Do not claim an integration-performance comparison yet.
