# Measurement revision — 2026-11-02

## Six-case replay extension

The [shared v4 suite](SIX_CASES.md) supersedes the earlier C02/C03-only coverage
described below. All four adapters now use the common fixed stage and observer.
json-render's shared entrypoint uses the real standalone composer and generation
endpoint; its earlier headless pilot entrypoint and saved evidence are preserved.
v4 makes detail dimensions and form title/field/date requirements explicit without
changing the data or expected values. Browser time is frozen to the fixture clock;
elapsed measurements still use monotonic `performance.now()`.

Every trial now clicks its required controls and verifies server-received action
payloads. Forms exercise both invalid and valid submissions. Interaction failures
clear `usableMs`. Generation timing stops before these action checks; an empty
server completion prevents action testing from causing another model generation.
This is controlled generation plus verified dispatch, not a full multi-turn journey.

Empty views become meaningful when their explanation passes the empty-view oracle;
forms require apartment identity and a visible field. `firstCompleteCardMs` means
requested record facts are complete; for a form those facts are only its identity,
so use `allContentMs`/`usableMs` for form completion. Keep case-specific timing
results separate. Literal replay fixtures are not a model ranking or evidence of
natural-language generalization.

The following sections document the earlier measurement cleanup and live pilots;
their original case coverage and costs have not been rewritten.

## What changed

1. **Explicit requirements, fixture v3.** “Identity” now says “title and
   neighborhood” in C02/C03/C04. The independent expected fields, 36 records and
   clock are unchanged. v2 is preserved; old missing-neighborhood results are not
   silently converted into passes.
2. **A verified 1280×900 viewport.** A2UI and OpenUI run inside a fixed-size iframe.
   The outer control page scales that stage to fit the browser; its header cannot
   push the measured app below the fold. The observer checks innerWidth/innerHeight,
   document visibility and worker readiness before invoking the model. Resize or
   visibility changes invalidate the trial. json-render's existing browser driver
   already requests 1280×900 and now asserts it too.
3. **Controlled assets.** A benchmark-only service worker replaces Unsplash image
   requests with `common/public/image.svg` while preserving the original DOM URLs
   for the fact oracle. Google font requests return an empty stylesheet; benchmark
   CSS uses system fonts. Production app photos remain unchanged. json-render uses
   the same image bytes through its existing network fixture. Image decoding is
   recorded but not included in the content-completeness verdict.
4. **Equivalent setup operations.** A2UI records/fields strategies can prepare the
   complete template with createSurface plus updateComponents before the first
   data update. Parent references must resolve before data begins. Component
   changes after data starts still fail the strategy check. Indexed records and
   per-record field updates remain separate strategies. Raw JSON validity and
   the native renderer's recovery remain separate results.
5. **One observer.** A2UI and OpenUI share `common/Observer.tsx`, the DOM oracle,
   budget transport, fixed stage and Promptfoo runner. The observer uses the same
   public addMessage/runAgent path as their real composer. There is no synthetic
   renderer and no postprocessing to make malformed model output pass.

## Timing definitions

All times start immediately before the first user message is submitted through
the app's public run path. Sample actual browser animation frames:

- `firstMeaningfulMs`: a correct record title and at least one numeric metric are
  visible in the measured viewport.
- `firstCompleteCardMs`: a record has every requested field according to the
  independent fact oracle, with its original image URL. It need not be above the fold.
- `allContentMs`: the whole requested view passes the content oracle and has no
  pending values.
- `usableMs`: content is complete and generated buttons are enabled. Final native
  contract, action-binding or runtime failures clear this value. This is **not**
  proof of the entire subsequent user journey.
- `runEndMs`: the app's runAgent promise completes. Provider first-token/finish
  timings are captured separately at the fetch boundary.

The timeline records record IDs, complete records, pending values, rendered
metrics and enabled buttons. Browser viewport, device scale, visibility and asset
policy are stored with every result. A 150ms post-run observation window captures
React's final commit; it is not added to the run-end timestamp.

Replay uses 96 UTF-16 characters per 8ms and a 250ms final hold. Its timings test
streaming mechanics; they are not model speed results. A2UI/OpenUI are single
GPT-5.4 low-reasoning calls through the pinned OpenRouter Azure EU endpoint, without
retries, route fallback or response cache. Provider usage includes cached-input
accounting and reasoning when reported. Save raw events, prompts, dependency locks
and source hashes before interpreting costs.

## What this does not establish

These are adapter smoke tests, not a ranking. The earlier json-render pilot uses
different models and cases; the original A2UI live pilot used v2 and an uncontrolled
viewport/image setup. Their timings cannot be compared against the refreshed
OpenUI pilot. Rerun a shared model/case matrix with repetitions before publishing.

Every A2UI/OpenUI trial checks native contracts, independent facts and structural
action bindings. Separate tests/smokes check actual dispatch and form validation;
the full multi-turn journeys and all six generation cases are not yet covered by
these two adapters. Current C02/C03 trials do not use date-sensitive browser logic;
future form journeys must also freeze the browser date to the fixture clock.

The existing $30 campaign ledger is shared between A2UI and OpenUI, under its
historical filename `results/a2ui-campaign-ledger.json`. Exclusive locking,
persisted reservations before requests and retained unknown charges prevent each
adapter or restart from receiving a new allowance. The older json-render pilot
predates this authorization and has separate historical spending.

## Hashbrown baseline

Hashbrown uses the same v3 C02/C03 tasks and common browser observer. The
CopilotKit agent sends the native `createUiJsonSchema` as strict structured
output; `useJsonParser` and `useUiKit` render partial nested JSON. Contract checks
validate that exact schema with Ajv, independently from DOM fact checks. Native
Skillet streaming text is enabled; controls wait for run completion. No output
repair or extra selection/tool calls are enabled. See hashbrown/PILOT.md.

The separate standalone Hashbrown app uses useUiChat and the OpenAI-compatible
Responses API adapter. Its manual smoke evidence is not scored as the same
transport or pooled into the Chat Completions pilot.
