# Hashbrown wiring pilot — 2026-11-02

Replay: 7/7 expected outcomes, including five independent negative controls.
Live: 2/2 passed native schema, visible-content, record-action and runtime checks.
These are smoke checks, not estimates of reliability or cross-framework rankings.

Model: openai/gpt-5.4, Azure/eu, low reasoning, no retries, max 16,000 output tokens.
Native Hashbrown JSON Schema is sent as strict structured output. Promptfoo eval:
`eval-MGT-2026-11-02T01:14:50`.

| Case | First meaningful UI | First complete card | Usable view | Cost |
| --- | --- | --- | --- | --- |
| C02 | 3.72s | 4.33s | 8.60s | $0.03733 |
| C03 | 4.24s | 5.21s | 29.10s | $0.11583 |

The browser timeline records nested content arriving before complete cards and
cards before the whole list. Actions remain disabled until the run completes.
Cache usage and output token counts are in each raw artifact. C03 used 3,328
cached prompt tokens; this tiny pilot cannot support a speed/cost ranking.

The scored runs use the v3 frozen dataset, fixed viewport and local image
substitution. The ordinary app includes all 36 records and real image requests,
so its manual smoke timings and cost are separate.

Production smokes: the CopilotKit app rendered a comparison of IDs 2, 7, 13;
the standalone native useUiChat/Responses path generated a tour form, rejected
an empty submit, submitted the entered values, and rendered a demo confirmation.
Native unit tests independently verify partial text/children, numeric money,
action IDs, form scoping/validation and disabled controls.

Costs: scored pilot $0.15316070; three production smoke requests $0.16751625.
Total for this refresh $0.32067695. Existing campaign total $1.83586370 of $30,
with no unsettled reservations. Browser interactions after handoff are excluded.

Artifacts: ../results/hashbrown-2026-11-02T01-14-17-075Z-live/ and
../results/hashbrown-*-smoke-*.json. Credentials and request headers are not saved.
The pilot predates installation of the missing production SQLite dependency,
the jsdom patch update, and removal of an unused non-OpenRouter branch. It used
explicit OpenRouter/Azure options; the measured generation/rendering path is
unchanged. Final production builds and replay validate the final tree.

Remaining series work: repeated multi-model trials and full task/journey
coverage. The standalone orchestration path is not yet a Promptfoo variant;
its manual smokes must not be pooled into the CopilotKit baseline.
