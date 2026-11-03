# Compositional workload v2

Defined November 1, 2026. These files describe inputs and independent expected
outcomes; no model scores or timings are stored here.

- `dataset.json`: 36 synthetic listings with derived fixed costs and illustrative
  galleries. Source hash points to `db/listings.json`; `db/pricing.ts` defines the
  derived totals. Unknown mandatory charges leave totals unknown.
- `cases.json`: six generation tasks C01–C06 and two journeys CJ01/CJ02.
- `cases-heldout.json`: six different confirmation variants and two journeys.
  Keep these out of model-prompt tuning. They share the published data domain;
  they are not evidence of generalization to other applications.

Only the case prompt and selected records go to the model. `expected`, selection
oracles and component-policy checks belong to the evaluator, never the prompt.
Equivalent valid component trees are allowed. Counts/depth describe a workload;
they do not grade its quality.

```sh
python3 benchmarks/validate_cases.py benchmarks/v2
python3 benchmarks/validate_cases.py benchmarks/v2 cases-heldout.json
```

These commands check data integrity, expected selections and field references.
The browser and model assertions remain to be wired through Promptfoo. Production
timing also requires local image fixtures; the interactive example currently
uses remote illustrative photos, so its ad-hoc timings are not benchmark results.

The first pilot is two models × C01/C02/C04 × three repetitions. Freeze the app
commit, prompts, serving routes and settings with the fixture hashes before a
scored run. Do not combine v1 and v2 results.
