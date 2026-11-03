# Compositional example verification — November 1, 2026

Scope: the two json-render examples and shared apartment data. Changes are local
on `codex/json-render-refresh`; the articles and other framework catalogs have
not been migrated in this step. These are functional checks, not benchmark scores.

## Implemented

- 18 bounded components. Cards contain generated children; forms contain
  generated inputs. No ApartmentCard, DetailView or TourForm shortcut.
- 36 synthetic listings with galleries, fees, computed mandatory costs, lease
  terms, pet restrictions, transit, reviews and intentional missing values.
- Comparison, twelve-result, detail and task-specific form compositions.
  Submission reads the submitted form's own fields and apartment ID.
- The standalone app can select OpenRouter with `MODEL_PROVIDER=openrouter` and
  `MODEL=<provider/model>`. Existing OpenAI behavior remains the default.
  Authentication was accepted by OpenRouter's read-only current-key endpoint.
  No credential values were logged or changed.
- Versioned v2 dataset, six generation cases and two journeys, plus confirmation
  variants. Root-level v1 fixtures remain historical.

## Controlled verification

The local fixture provider labels its output as scripted. It exercises the real
renderer and, for CopilotKit, the LangGraph tool/result path. It does not establish
model reliability, inference latency or cost.

- Standalone: comparison → details → tour form → demo confirmation.
- Native required-field validation stops an empty submission.
- Two forms in one view: leaving the first empty and submitting only the second
  produces apartment 7's confirmation with the second form's name, email, date,
  phone and video-tour selection. No first-form values leak into the request.
- Twelve-result view renders exactly twelve record cards and twelve detail controls.
- CopilotKit: comparison → apartment 7 details → generated form → demo confirmation,
  preserving that record and the submitted fields.
- Comparison and dense-result markup from the actual React registry and production
  stylesheet fits 390px and 320px frames: body scroll width equals viewport width.
  Desktop interactions were checked separately; these frame checks are visual,
  not a mobile-device interaction test.
- A malformed JSONL patch produces an explicit error/retry state in standalone;
  partial-view actions are disabled and raw protocol text is not displayed.
  The output is not repaired or completed with expected answers.

## Live smoke observations

The development default was direct OpenAI `gpt-4.1`. These exploratory calls were
not randomized trials and had no complete usage/timing capture.

- Early comparison outputs had correct monthly costs but omitted required
  controls and/or photos. Instructions were made explicit on development tasks.
- A subsequent comparison included all three records, photos, the requested
  criteria, per-record detail/tour controls and back navigation. Its detail
  action reached the intended record.
- That detail response contained a malformed final patch and lacked its back
  control. It also included an unsupported screening-related statement. This is
  a format/content failure, not a passing detail benchmark. The malformed-patch
  error presentation above was added and checked with a scripted reproduction.

These observations support making composition part of the workload. They do not
support a model ranking or a reliability percentage. No semantic repair was added.

## Checks and next step

Follow-up from the twelve-result report: the original app-specific literal-only
instruction conflicted with the framework's default repeat/state instructions.
A live reproduction emitted invalid nested-cost paths and incorrect rent order.
The apps now use native repeated compositions with slash-separated bindings,
numeric Metric formatting, and value-resolving templates only for repeated action
IDs. Application rules are appended after generic catalog instructions. The
standalone prompt supplies records ordered by base rent. This is input preparation,
not a post-generation repair. Future scored runs must hash this changed prompt.

Live checks showed twelve correctly ordered cards with correct numeric prices,
two unknown totals preserved as unknown, and an apartment-12 detail click that
selected apartment 12. The ensuing detail output was malformed and remained an
explicit failure. Some list outputs omitted the requested supplemental unknown-fee
explanation, prompting a more explicit conditional section in the list recipe.
The final browser run rendered all twelve expected IDs, 24 controls, correct
numeric values, and labeled known subtotals with a missing-fee explanation for
apartments 12 and 22; no unresolved/Unavailable metric text remained. Two captured
development responses also passed structural, source-value and resolved-action
checks. These observations still do not establish a benchmark pass rate.

Both apps pass typechecking and production builds. Catalog/tree and cost tests
pass; CopilotKit parser tests pass. All v1/v2 case manifests validate against
their snapshots; Python modules compile; `git diff --check` passes.

Next: a thin Promptfoo adapter to the existing generation path, raw-output and
usage capture, browser timing/action assertions, pinned routes and a spend cap.
The 18-trial cross-model pilot has **not** run. Local image fixtures for benchmark
timing and final prompt/configuration hashes are still required before scored runs.
