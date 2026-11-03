The four adapters now share the [six-case replay suite](SIX_CASES.md), including
real action dispatch and generated-form checks. See [measurement definitions](MEASUREMENTS.md)
before comparing results.

# Next Place: generative UI benchmark protocol

Status: **Shared six-case replay and action verification; model comparison pending**.
The earlier **json-render 18-generation pilot** remains historical evidence.
The [A2UI variant adapter](a2ui/README.md) now adds tool/Markdown transport × four
update strategies, deterministic replay checks, and a budgeted live pilot.
See [run instructions and limitations](RUNNING.md). The November 1 pilot cost
$0.474309495. Agent review found 11/18 task passes after correcting six content-check
false negatives. This validates the first measurement path, not a publishable ranking.
The initial browser timing probe was tightened after the pilot; use its original
timings as diagnostics only. [Local reviewed report](results/2026-11-01T02-08-55-143Z-live/report.md).
Updated November 1, 2026. The [compositional brief](compositional-ui.md) defines the
18-component catalog and richer workload. Current cases and the 36-record
snapshot are in [`v4/`](v4/); v2/v3 remain historical. Root-level v1 JSON files remain historical smoke
fixtures. Functional smoke checks are not benchmark scores.

Tracking: [maximzubarev#104](https://github.com/mxmzb/maximzubarev/issues/104).
This directory is the canonical home for the public article benchmark. The older
research workspace and AgentBench runs are historical material, not evidence for
the refreshed articles. Promptfoo will own execution and result storage; this
directory supplies app-specific cases, assertions, and observation adapters.

## The decision this benchmark supports

Given a component library and a requested interface, which **framework × model ×
configuration** produces correct, usable output at an acceptable cost and speed?

Compare frameworks with the same model first. Then compare models within each
framework. A cheaper model may change the preferred stack. Do not collapse the
three dimensions into a weighted score or declare a universal winner.

The main comparison is A2UI, OpenUI, json-render, and Hashbrown. CopilotKit is an
integration choice, not a mandatory second axis. No conventional React baseline
or argument about whether generative UI should exist is required. Keep existing
integration examples; do not delete them or silently substitute A2UI for another
framework's CopilotKit adapter.

## Two experiments, reported separately

### A. Controlled UI generation — primary framework comparison

The application selects the records before calling the model. Every framework
gets the same ordered data, task requirements, available visual components, and
actions. Its catalog, protocol instructions, output grammar, and documented
generation mechanisms may differ. Their tokens and calls count.

Use six fixtures in `v4/cases.json`: a composed listing, a three-apartment
comparison, twelve results, rich details, an empty result and a generated form.
Every visible field and control is composed from the small catalog.
This avoids measuring SQL selection or an extra orchestrator as UI-format cost.
Native structured decoding is allowed where supported, but record it as part of
the configuration; a model/endpoint that lacks a required capability is an
unsupported combination, not a failed generated response.

Prefer each framework's smallest idiomatic path. A2UI can use native CopilotKit
surfaces, provided the controlled task reaches the generation path with its
records already selected. Any unavoidable orchestration remains visible and
counted. Label results as tested implementations, not pure protocol overhead.

### B. Complete interactions — application comparison

Run two journeys through the actual browser: search/refine/detail/back, and a
demo tour request including an invalid submission. Preserve state within the
journey and reset it between trials. Count every model call and every failed
turn. Do not synthesize a successful continuation after an earlier step fails.

Local handlers and native state bindings are allowed. Do not force an LLM call
on every button merely to make implementations look alike. Record which steps
use a model and which run locally. These results describe app architecture as
well as the renderer; do not merge them with experiment A's ranking.

## Dataset and exact task oracles

`v4/dataset.json` is a frozen export of 36 synthetic listings, including fees,
derived costs, galleries, lease terms, amenities, transit and reviews. Its source
JSON SHA-256 is recorded alongside it. Use the snapshot in benchmark runs, not a
changing development database. `v4/cases.json` records ordered input IDs, exact expected IDs, required fields,
actions and journey transitions. Expectations are independent of model output.

All listings are synthetic. Freeze the browser's date to 2026-11-02 for tour
tests; use 2026-11-14 and `reader@example.com` as synthetic form values. Image
URLs must match their record; approved size-only image transformations are
equivalent. Use identical local image fixtures during timing so a third-party
image CDN cannot determine a framework's rank. Publish their mapping when added.

Run `python3 benchmarks/validate_cases.py benchmarks/v4` from the repository root to check the
fixture relationships, search oracles, ordering and snapshot integrity. This is
a **data check**, not a model evaluation or a UI pass rate.
Run `python3 benchmarks/validate_cases.py benchmarks/v3 cases-heldout.json` for the
historical confirmation variants, which still need an explicit v4 migration before
the comparison campaign. They use different listing selections, budget boundaries
and form values from the same dataset; they are held out from prompt tuning, not
secret data or evidence of generalization to a new domain.

## Reliability: separate the layers

Every trial reports these independent outcomes, with `null` for unobserved stages:

1. **Raw format validity:** the unmodified complete output parses according to
   that framework's format. Keep the raw response before repair or transformation.
2. **Contract validity:** component names, props, references and action parameters
   satisfy the actual catalog. A regex for `root =` or one A2UI operation is not
   sufficient. Record partial streaming states separately from final validity.
3. **Content correctness:** required records and values match the oracle, in the
   specified order, with no duplicate, extra or invented listings. Formatting
   differences such as `$3,100/mo` are normalized explicitly.
4. **Interaction success:** required controls are visible, enabled and wired to
   the right listing. In A, click through the real action binding into a test sink
   and verify its ID/parameters without generating another view. In B, run the
   real handler and verify the next state. Merely finding a button node or a
   syntactically valid spec does not establish this.

Primary task success requires contract, content and the task's interaction checks
to pass. Raw-invalid output repaired successfully may pass the app-level task but
must remain a raw-format failure. Report raw success, deterministic-repair success,
and model-retry success separately. Never repair semantic content with the oracle.

Use deterministic checks for IDs, prices, fields, bindings and DOM transitions.
For free-text claims, use a predeclared rubric: supported facts, explicit demo
wording, and no promise of an actual booking/contact. Review all flagged cases
and a fixed random sample of passes blind to framework/model. A judge model, if
introduced later, is a secondary annotated signal, not the primary truth source.
Do not claim comprehensive factual correctness from a few keyword checks.

## Timing: observe the browser, not just the stream

- `started`: the user action is dispatched, before the app sends its request.
- `first_meaningful_visible`: a task-relevant component with meaningful content
  is on screen. A spinner, heading-only shell or empty container does not count.
- `usable`: all required content is present and the required controls are enabled.
  Reaching this state must be followed by the specified interaction check.
- `finished`: the request/journey reaches success, failure or its deadline.
- Record first provider token and stream completion separately for diagnosis.

Use monotonic timestamps on one observer for elapsed browser metrics. Correlate
backend calls by trial/turn/call ID; never subtract wall clocks from different
processes. Trace render readiness and verify it through the browser. Do not allow
the app to declare success without checking the visible state and real controls.

Measure production builds at a fixed 1280×900 viewport with browser/version and
host recorded. Each trial gets fresh chat/state/storage; static assets are warmed
uniformly. Cold page loading and model loading are separate measurements. Local
inference runs without simultaneous cloud/browser benchmark jobs competing for
the same machine. Record whether its model is already resident.

## Cost and token accounting

Persist every call's requested and returned model, serving provider, input,
output, cached input and reasoning-token accounting where available. Preserve
the provider's original usage object to prevent double-counting reasoning tokens.
Count schema/tool descriptions, conversation history, orchestration, generation,
retries and fallbacks. A system-prompt token estimate is a diagnostic, not total
input usage. Tokenizers differ; do not treat token counts across models as bytes.

Report:

- mean cost per attempted task;
- **effective cost per successful task = total cost of all attempts / successes**;
- cost among successful attempts, clearly labeled as conditional;
- first-attempt and recovery-policy results separately;
- measured provider charge and a no-discount estimate at dated list prices, when
  the usage categories needed for that estimate are known.

With no successes, effective cost per success is undefined. Unknown usage/cost is
`null`, not zero. Local runs may have zero API charges, but electricity, hardware
and operator cost are not zero; report them as unmeasured unless measured. Do not
put a free local-API figure on the same dollar chart as total hosted costs.

OpenRouter's model catalog prices are a planning snapshot. Actual routing, prompt
caching, tiered prices and charges may differ. Freeze the route and record the
actual serving provider; direct-provider results are separate configurations.

## Models and routes

`models.json` records the **selected shortlist**, not a runnable config
or a compatibility claim. See [model selection](MODEL_SELECTION.md) for the ten
hosted models, local candidate and outstanding route checks. It includes economical
and stronger hosted models, open-weight candidates and a previously installed
local alternative. Add model rows
without changing the tasks or assertions. Do not benchmark every permutation
before the measurement path works.

For OpenRouter, select an exact endpoint from its provider list, require required
parameters, disable provider/model fallbacks and automatic response healing, and
record the resolved route. Unsupported tool/structured-output behavior is a
compatibility result. Do not silently emulate it. Document reasoning settings;
`low` across vendors is not an equal compute budget. Do not force temperature
where unsupported. Freeze these settings before scored runs.

For local models, record weights digest, quantization, inference engine/version,
context size, sampling/thinking settings, hardware, memory and warm/cold status.
A hosted model with the same family name is not necessarily the same weights or
quantization. Hardware-specific latency is not a general model speed claim.

## Trials, tuning and uncertainty

1. **Instrumentation pilot:** after the compositional example and v2 fixtures,
   json-render × two models × three cases × three repetitions = 18
   controlled-generation trials. Use C01, C02 and C04 from the new brief. Inspect
   every trace manually. This establishes the measurement path, not rankings.
2. **Screen:** four frameworks × eight hosted candidates × six cases × five
   repetitions = 960 trials before recovery. Report every compatible cell,
   including failures. Local models run in a separately labeled hardware cohort.
3. **Confirm:** use the fixed anchor panel below plus the selected challenger.
   Start with 30 repetitions per held-out case/configuration, fixed in advance. Increase only
   in a separately declared follow-up; do not stop when a preferred model wins.
4. **Journeys:** measure the supported app/model configurations on CJ01 and CJ02
   after the browser assertions pass on deterministic fixtures. Keep their
   results separate from controlled generation.

The hosted confirmation anchors are `openai/gpt-6.1-sol`,
`anthropic/claude-sonnet-5.5` and `google/gemini-3.8-flash`, each across all four
frameworks. Select one additional hosted model from the remaining candidates:
it must support all four implementations, then rank by equally weighted
first-attempt task success across the six cases/four frameworks. Break exact ties
by lower mean cost per attempt, then lower median successful usable latency, then
model ID. A candidate with unknown cost/timing cannot win a tie on that field.
If no candidate qualifies, report three anchors; do not invent a substitute after
seeing confirmation scores. Unsupported anchors remain visible, not silently
replaced. Report the full screening table so the challenger choice is auditable.

Develop prompts on `v3/cases.json`; use the six CH cases in
`v2/cases-heldout.json` for confirmation and CHJ01/CHJ02 for journey confirmation. Freeze their
hashes with the prompt/configuration hashes before scored runs. The four-model
hosted confirmation is 2,880 generation trials if every combination is supported.
Do not hide that expansion behind the 18-trial pilot budget. The installed local
candidate has its own hardware cohort and cannot displace a hosted anchor.
Recheck the finalist selected on noisy screening data independently.

Use identical randomized case/configuration blocks, saved order seeds and at
least three time blocks. No response-cache reuse from Promptfoo. Provider prompt
caching can still happen: report cached tokens, don't pretend it was disabled.
Primary runs have no application repair call; label any automatic framework or
SDK retries and include their cost. A separate recovery condition permits at
most one model correction using actual validator feedback, not expected answers.

Deadlines: 120 seconds per generation and 600 seconds per journey. Freeze them
before runs; timeout is a failure with censored latency, not a fast completion.
Keep transport/rate-limit errors separate from model failures but visible in
operational success. A declared infrastructure rerun preserves the original row.

Report numerator/denominator and Wilson 95% intervals for pass rates. At 30/30,
the lower bound is approximately 89%: do not call that proof of 99% reliability.
Show successful-run latency distributions with success rates beside them; report
timeouts and unsuccessful attempts too. Avoid p95 claims from the five-run screen.
Use per-task results and equally weighted task summaries; do not let large lists
or retries silently change task weights. Any pairwise superiority claim needs
intervals/effect sizes and the stated comparison family, not dozens of uncorrected
p-values. A small synthetic dataset limits generalization to other UI domains.

## Execution, budget and evidence contract

Promptfoo owns providers, cases, repetitions, assertions and exported evaluations.
A thin adapter calls the existing app generation path; browser observation checks
the real renderer. Do not introduce a parallel generation implementation merely
for better benchmark scores. AI Mock/replays may verify instrumentation but cannot
supply live latency, model reliability or spend.

Before paid runs, print planned trials, token limits, per-model prices and a
worst-case spend ceiling. A run must require an explicit `maxSpendUsd`, track spend
and reserve the maximum next-call cost before starting it. Missing prices disable
automatic spending. Scope agreement is not an unbounded API budget. The plan
command makes no paid calls; a live run requires an explicit cap.

Each exported trial must include: experiment/case/repetition IDs, input hash,
framework/version/commit, dirty patch hash if applicable, catalog/prompt hashes,
model/route/settings, dataset hash, environment/cache policy, all calls and usage,
browser timestamps, raw response reference, layer verdicts/reasons, retry count,
timeout/error class, screenshots/traces and final outcome. Export sanitized
requests; never save API keys or authorization headers.

Article charts must be derived from those exports with a recorded command and
input hash. Every number must resolve to its trial rows and denominators. Native
capabilities, our implementation choices and observed results need separate
labels. No invented numbers, simulated live latency or preselected winning story.

## Work order and completion

- [x] Establish the question, v1 fixtures, metrics and candidate model inventory.
- [x] Verify the v1 source dataset and deterministic selection expectations offline.
- [x] Add v1 confirmation variants and define the screening-to-confirmation selection rule.
- [x] Implement the granular json-render catalogs and richer example data.
- [x] Complete functional live and responsive smoke verification of the compositional
      example. [Evidence and observed model failures](compositional-verification.md);
      this is not a benchmark pass rate or full mobile-device interaction coverage.
- [x] Define and validate v2 cases and fresh confirmation variants against the
      expanded data. Freeze final prompt/config hashes before scored runs.
- [x] Wire one json-render generation path to Promptfoo, capture all usage, and
      prove selection reaches the actual model rather than only the result label.
- [x] Validate browser timing and action assertions with controlled responses.
- [x] Estimate and cap the pilot; run and inspect its 18 live trials. Agent-reviewed;
      independent blinded review and publication-quality timing remain for confirmation.
- [ ] Refresh/pin the other three implementations and reconcile their component
      contracts. Reuse Next Place's presentation without inflating functional code.
- [ ] Run the declared comparison and publish reproducible evidence with articles.

The first executable milestone—one app, two models and the instrumentation pilot—is
complete. The wider comparison and article evidence remain outstanding.
AgentBench retirement and unrelated consumers stay tracked
in #104; this directory does not claim they have already migrated.

## References checked October 30, 2026

- [Promptfoo custom providers](https://www.promptfoo.dev/docs/providers/custom-api/)
- [Promptfoo configuration](https://www.promptfoo.dev/docs/configuration/reference/)
- [OpenRouter provider routing](https://openrouter.ai/docs/guides/routing/provider-selection)
- [OpenRouter model catalog](https://openrouter.ai/api/v1/models)
- [OpenAI model catalog](https://developers.openai.com/api/docs/models)
- [Claude model catalog](https://platform.claude.com/docs/en/models/overview)
- [Gemini model catalog](https://ai.google.dev/gemini-api/docs/models)
