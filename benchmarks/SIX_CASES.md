# Shared six-case suite

Latest evidence: [November 2 replay report](results/six-case-replay-2026-11-02.md)
— all 85 expected baseline outcomes and 12 additional strategy regressions passed.

All four frameworks use fixture revision 4, the same frozen 36-record dataset,
the same DOM fact oracle and the same browser action checks. Promptfoo schedules
trials and stores their independent verdicts. Replay replaces the model response
at the provider boundary; the app's generation SDK, parser, renderer, components
and action handlers still run.

| Case | Required view | Action checks |
| --- | --- | --- |
| C01 | One composed listing | Details and tour target the correct record |
| C02 | Three-apartment comparison | Both actions on all three records; back |
| C03 | Twelve ordered listings | Both actions on all twelve records |
| C04 | Rich detail, gallery, fees and totals | Tour and back |
| C05 | Empty result with budget explanation | No invented listing or action |
| C06 | Generated tour form | Back, required fields, email/date validation, scoped submission |

The C06 checker tests each missing required field, invalid email and a date before
the fixture clock. These must produce no outgoing action request. It submits valid
values with the optional checkbox unchecked and checked; the server must receive
exactly the entered values and correct apartment ID. A decoy input outside the
form catches global input collection. Synthetic values only; no real tour request
or external message is sent.

## Run replay

From this directory, on Node 24.20+ with benchmark and app dependencies installed:

```sh
pnpm shared --framework json-render --mode replay --port 15513
pnpm shared --framework a2ui --mode replay --port 15510
pnpm shared --framework openui --mode replay --port 15511
pnpm shared --framework hashbrown --mode replay --port 15512
```

Open the printed localhost URL and click **Run suite**. Run one browser suite at
a time, keeping its measured page visible until completion. Each server builds
its production benchmark bundle before serving it. No model credentials are used
in replay; loading the existing local env file does not cause a provider request.

json-render uses the real standalone `ApartmentFinder` and `generateUI` endpoint
path. The other adapters use the real CopilotKit runtime and workspace with each
framework's native renderer. This tests four implementations; it does not isolate
the cost of orchestration or compare standalone against CopilotKit.

A2UI defaults to **tool-batch and markdown-batch** for the six-case baseline.
The existing records/fields strategies are defined for C02/C03's repeated records,
not arbitrary detail/form views. To exercise all eight strategies there:

```sh
pnpm shared --framework a2ui --mode replay --cases C02,C03 --variants tool-batch,markdown-batch,tool-components,markdown-components,tool-records,markdown-records,tool-fields,markdown-fields --port 15514
```

Use `--cases C06 --skip-controls` for one valid form trial per selected variant.
The six-case default includes eleven deliberately bad outputs per configuration:
wrong price, wrong action target, missing field, unknown component, truncated
output, dead action, wrong detail fee, invented empty-state listing, unexpected
empty-state action, missing required-field constraint and wrong form target.
A negative-control **pass** means its designated checker rejected the output.
It must not be included as a successful generated task in an article pass rate.

## What the evidence establishes

Each action is initiated by a DOM click through the app's existing handler. The
benchmark endpoint captures the resulting request and normalizes its action,
record ID and submitted values without consulting the expected answer. It sends
an empty completion so there is no second generation. The observer restores the
original generated view between controls and freezes generation timings before
starting action checks. This verifies dispatch, validation and payloads; it does
not establish the correctness of a subsequently generated detail or confirmation
view. Full CJ01/CJ02 journeys remain a separate experiment.

Assertions remain independent of replay output construction. The replay tree is
only a fixture serializer; the oracle reads versioned records and actual DOM.
Content checks cover requested identities, numeric values, photo URLs, fees and
other declared details. Free-text summaries and reviews still need the article's
manual factual review; deterministic checks do not establish complete semantic
correctness. DOM clicks also do not establish keyboard or pointer accessibility.

Every run saves raw responses, native validity/recovery, final DOM, generation
timelines, action attempts, captured server requests, environment, source hashes
and dependency locks under `results/<framework>-<timestamp>-replay/`. The fixed
1280×900 stage uses local image fixtures, system fonts and the November 2 fixture
clock. Replay timings describe stream delivery and rendering, not model speed.

## Next: model comparison

Replay establishes that the harness accepts correct fixtures and catches seeded
failures. It does not show how reliably any model generates those fixtures.
The [model shortlist](MODEL_SELECTION.md) was selected on November 3. Pin provider
routes and add the selected configurations, complete a small compatibility pilot, and
freeze repetitions/order/budget before the full matrix. Shared json-render live
mode remains disabled until its selected model/route configuration is
implemented; its earlier pilot remains preserved separately.

The existing campaign ledger and $30 cumulative cap still apply. No new allowance
is created by adding cases or adapters. Do not run the legacy hardcoded live model
settings as if they were the agreed comparison shortlist.
