# A2UI transport and update-strategy pilot

This adapter uses the real `a2ui-copilotkit` runtime, catalog and React workspace.
Promptfoo schedules and grades trials. A small browser page runs each trial using
the same public `agent.addMessage` / `copilotkit.runAgent` path as the app composer.
There is no second generation implementation or custom A2UI renderer.

## Try the variants

The app runs at <http://127.0.0.1:3003/>. Its transport and generation selectors
reset the conversation and put the selection in the URL. For example:
<http://127.0.0.1:3003/?transport=markdown&generation=fields>.

| Strategy | First operation | Following operations |
| --- | --- | --- |
| Batch | Root component and all selected data | One component-tree update |
| Components | Root component and all selected data | One component per update |
| Records | Complete reusable tree, empty records array | One complete apartment per indexed update |
| Fields | Complete reusable tree, empty records array | Seed an apartment's ID and nullable costs, then update its other top-level fields individually |

Each strategy runs through either one `render_ui` call or one page-targeted A2UI
Markdown fence. Operations do **not** require separate model requests. More
operations still mean more output text/tokens. The tool parser releases complete
operations; the Markdown path can release complete components from an unfinished
component operation. Replay and live results must be reported separately.

All variants use the same partial-value behavior: undefined fields show a pending
state during generation and “Unavailable” if unresolved at the end. A supplied
null means unknown. Nullable costs travel as an object because a null *leaf update*
deletes a data-model key. Actions unlock at run completion for every variant; an
earlier readable card does not mean an earlier interactive card.

## Run

From `benchmarks/`, with dependencies installed in this directory and the app:

```sh
pnpm typecheck
pnpm test
pnpm a2ui --mode replay
# Open http://127.0.0.1:15501/ and click Run suite.

# The original eight-strategy comparison is restricted to repeated-record views:
pnpm a2ui --mode replay --cases C02,C03 --variants tool-batch,markdown-batch,tool-components,markdown-components,tool-records,markdown-records,tool-fields,markdown-fields

pnpm a2ui --mode plan
pnpm a2ui --mode live --max-spend-usd 30 --port 15502
# Open http://127.0.0.1:15502/ and click Run suite.

# One zero-cost cell, useful for browser action checks:
pnpm a2ui --mode replay --skip-controls --cases C03 --variants markdown-fields --port 15503

# Regrade saved evidence without any model calls (original files stay intact):
node --import tsx a2ui/regrade.ts results/REPLACE_WITH_RUN_DIRECTORY
```

The browser must remain open until the suite completes. The runner builds the
browser bundle before serving it. It never launches a hidden browser. There is a
180-second browser deadline and a 120-second provider request deadline per trial.

The default matrix is all six v4 cases over tool-batch and markdown-batch.
Replay adds eleven negative controls per transport. The [shared suite](../SIX_CASES.md)
clicks every required control and checks submitted form values at the server.
Records/fields strategies currently cover C02/C03; select those cases explicitly.
The model
receives only the task prompt and selected records, never the expected answers.
The deterministic fixtures end in identical trees/data across strategies. Live
models may choose different valid compositions: those are implementation-level
outcomes, not an isolated measurement of protocol serialization overhead.

Live mode pins `openai/gpt-5.4`, OpenRouter `azure/eu`, low reasoning, ZDR, no
fallback, 16,000 output tokens, one generation step, and zero retries. The existing
`json-render-standalone/.env` is read without modification. Current endpoint prices
are fetched before the run. Full runtime-injected prompts and schemas count.

`results/a2ui-campaign-ledger.json` persists charged or conservatively reserved
spending. The cap cannot exceed the authorized $30. Unknown/aborted usage keeps
its reservation; restarting does not make it free. A lock prevents two paid
runners sharing that ledger. After a crashed process, reconcile its reservations
before removing the stale lock. Do not delete the ledger to bypass the cap.

## Evidence and limits

Each trial saves the provider request body (no authentication headers), timestamped
SSE events, raw generation, usage including cached/reasoning tokens, provider cost,
final DOM, content/action checks, and browser timeline. The manifest fingerprints
source and dependency locks and records the dataset, cases, prompt hashes, route,
and output limit. Promptfoo stores the evaluation in the existing `.promptfoo/`
database; the same result is exported under `results/a2ui-*/`.

Independent verdicts (see the [first pilot report](PILOT-2026-11-02.md)):

- Raw transport syntax, reported separately from native operation/catalog validity.
- Compliance with the requested update strategy.
- Rendered values, record count/order, unknown-cost handling and pending fields.
- Structural action bindings: each action points to the record containing it.
- Runtime completion/errors.

The Markdown grader uses the installed renderer's public `extractFenceOperations`
and `prepareSurfaceOperations`, retaining recovery diagnostics. A malformed raw
response can therefore pass the native contract and rendered-content checks.
Raw format is not folded into the overall task pass, matching the json-render
adapter's policy. Strategy compliance remains an independent requirement. The
offline regrade records zero new spending; its output retains original generation
costs rather than billing them a second time in Promptfoo. Its UI latency is the
offline grading duration; original inference/browser timings remain in each output
and the pilot report. Use the original live evaluation for billed cost/usage.

Structural action checks are supplemented by actual DOM clicks and form
submissions on every trial. The benchmark endpoint records the resulting requests
and returns an empty AG-UI completion without another model call. Complete
detail/tour journeys remain a separate experiment.

The observer records first meaningful **on-screen** content, first complete card,
all content complete, controls usable, run end, and a progression of records,
fields, pending values and enabled buttons. Null means the milestone was never
observed. Complete-card/content checks cover the rendered layout, including areas
below the fold; they exclude remote image decoding. Image URLs and load status are
recorded separately. Actual viewport/visibility are recorded per trial; never
replace them with a requested viewport that the browser did not apply.

Replay sends 96 JavaScript string characters every 8 ms, then holds the stream open
for 250 ms. Its timing demonstrates parser/renderer behavior only. Live timings
include inference and transport. One sample per cell is an instrumentation pilot,
not a reliability estimate or publishable speed ranking. Review content-check
failures for false negatives before using them in the article.

## Measurement revision

Future runs use fixture v3 and the shared fixed browser stage described in
[MEASUREMENTS.md](../MEASUREMENTS.md). The final cleanup replay passed 22/22
expected verdicts. Previous v2 artifacts remain unchanged. The records/fields
setup may span multiple native setup operations before the first data update.
The live budget ledger is shared with the OpenUI adapter.
