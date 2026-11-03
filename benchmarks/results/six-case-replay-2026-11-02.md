# Six-case replay verification — November 2, 2026

**All 85 expected outcomes passed:** 30 valid generations and 55 seeded failures.
An additional 12 A2UI streaming-strategy regressions passed. These are replay
results, not model pass rates. No paid requests were made.

| Implementation | Valid cases | Negative controls caught | Promptfoo |
| --- | ---: | ---: | --- |
| json-render standalone | 6/6 | 11/11 | [Results](http://127.0.0.1:15500/eval/eval-pTN-2026-11-02T01:56:55) |
| A2UI, tool-batch + markdown-batch | 12/12 | 22/22 | [Results](http://127.0.0.1:15500/eval/eval-hjI-2026-11-02T01:55:05) |
| OpenUI with CopilotKit | 6/6 | 11/11 | [Results](http://127.0.0.1:15500/eval/eval-aPz-2026-11-02T01:51:02) |
| Hashbrown with CopilotKit | 6/6 | 11/11 | [Results](http://127.0.0.1:15500/eval/eval-JlR-2026-11-02T01:54:24) |

All configurations covered one listing, three-way comparison, twelve results,
rich details, empty results and a generated tour form. A2UI's other six
transport/strategy combinations passed C02/C03: [12/12 regression results](http://127.0.0.1:15500/eval/eval-jxw-2026-11-02T01:57:44).
These additional strategies are not claimed to cover every view type.

## Real actions

The valid six-case runs produced **190 verified action requests**, plus **35
invalid form attempts that correctly produced no request**. The A2UI strategy
regression added 186 verified requests. These counts exclude deliberately broken
control trials.

- Every listing's Details and Schedule Tour controls sent its correct ID.
- Comparison/detail/form Back controls sent the expected navigation action.
- Empty results exposed no listing or action.
- Forms blocked each missing required field, an invalid email and a past date.
- Valid forms sent the correct apartment ID and exact entered values with the
  optional checkbox both unchecked and checked.
- An input outside the form was excluded from submission.
- Each valid click/submission produced exactly one request within the observer's
  dispatch window. Wrong IDs, dead buttons and wrong form targets were rejected
  by the interaction checker even when the native output contract was valid.

These are actual DOM clicks through each application's action handlers. Requests
are captured at the app server, which responds without another model generation.
They prove dispatch and form behavior; they do not prove a generated continuation
or the complete CJ01/CJ02 journeys. The test sink and reset between controls are
documented in [the suite protocol](../SIX_CASES.md).

## Inputs and verification

Fixture v4 preserves the previous 36-record dataset and oracle. It makes C04's
dimensions and C06's apartment title, field/option names and date boundary explicit
in the prompts. Earlier inputs and results remain intact. Details, empty states
and forms now have view-appropriate DOM checks instead of inheriting listing-only
requirements. The illustration apps and their environment files were not edited
for this extension; the changes are in the benchmark harness, fixtures and docs.

Checks completed:

- Benchmark TypeScript check and all 24 Node tests passed.
- Each of the four production benchmark browser bundles built successfully.
- Browser replay: 85/85 main outcomes plus 12/12 streaming regressions.
- Fixture integrity validator: 36 records, six cases and two declared journeys.
  Validating journey declarations is not executing those journeys.
- `git diff --check` passed for tracked changes.

The new API spending is **$0**. The existing campaign ledger remains at
**$1.83586370 of the cumulative $30 cap**, with no unsettled reservations. The
replay runner's zero campaign counter means it did not open a paid ledger; it
does not reset or replace the existing campaign balance.

## Saved evidence

Each directory contains the manifest, numbered trial JSON, final DOM, raw stream,
native verdicts, action attempts and server requests, plus the Promptfoo export:

- [json-render](json-render-2026-11-02T01-50-50-742Z-replay/summary.json)
- [A2UI baseline](a2ui-2026-11-02T01-50-50-738Z-replay/summary.json)
- [OpenUI](openui-2026-11-02T01-50-50-761Z-replay/summary.json)
- [Hashbrown](hashbrown-2026-11-02T01-50-50-733Z-replay/summary.json)
- [A2UI strategy regression](a2ui-2026-11-02T01-57-05-873Z-replay/summary.json)

## Before publishing model results

Agree the model/provider shortlist with Maxim, configure those exact routes and
run a small compatibility pilot. Shared json-render paid mode is intentionally
blocked pending that configuration. Then freeze repetitions, ordering and budget
before the comparative run. Full journeys, migrated held-out confirmation cases
and manual prose/factual review remain separate work. Replay latency and the
Promptfoo row execution time must not be published as model generation speed.
