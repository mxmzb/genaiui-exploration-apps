# Run the json-render pilot

Run commands from `genaiui-exploration-apps/benchmarks`. Requires Node 24+, pnpm,
the installed standalone app, and `OPENROUTER_API_KEY` in the standalone app's
existing `.env`. The runner reads it without changing that file.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm build:browser
pnpm test
pnpm typecheck
pnpm pilot --mode fixture
pnpm pilot --mode plan
pnpm pilot --mode live --max-spend-usd 3
```

The plan makes no model calls. It prices 18 calls: C01, C02 and C04, two models,
three randomized balanced blocks. The seed and actual schedule are exported.
The live command refuses a missing cap, unknown prices, or a cap below its
conservative estimate. Set a different explicit cap if current prices require it.
Fixture/live runs rebuild the browser bundle before recording its source hashes.
There are no model retries, judge calls, response healing or provider fallbacks.

The fixture run uses scripted OpenAI-compatible streams through the same SDK,
generation function and browser. Three positive controls must pass; incorrect
prices, wrong action targets and malformed JSONL must fail. It also asserts that
meaningful content appears before the scripted stream ends. Fixture latencies and
zero token counts are **test data**, never model-performance evidence.

## What the adapter does

Promptfoo executes the configured cases, invokes providers, evaluates assertions,
stores evaluations locally and exports `promptfoo.json`. Each case selects a
model; the adapter verifies the actual request and returned model/provider.
Repetitions are materialized as cases to preserve balanced randomized block order.
Concurrency is one and Promptfoo's response cache is disabled.

The server calls the standalone app's existing `generateUI`, with the selected
model and a system prompt containing only that case's frozen records. The browser
loads a production build of the actual `ApartmentFinder`, catalog, registry and
styles, including the existing json-render 0.21.3 streaming patch. The only app
source additions for benchmarking are optional generation settings and frozen
records/date inputs to its prompt function. Normal app defaults stay intact.

Action checks click actual controls, observe json-render's resolved action events,
and require the real app handler to reach a request sink. The sink returns an empty
response, so these checks incur no extra model calls. They prove dispatch and
record targeting, not the success of a subsequent generated detail/tour view.

Pinned routes are GPT-4.1 via `azure/swedencentral` and Gemini 3.8 Flash via
`google-vertex/us`, both through OpenRouter with ZDR required. These were selected
after the account rejected direct OpenAI and Google AI Studio routes. GPT-4.1 uses
temperature 0.3. Vertex does not advertise temperature support, so it is omitted;
Gemini uses `reasoning.effort: low`. The exact request, route snapshot and usage
remain in each export. This compares configurations, not equal reasoning budgets.

Every original Unsplash image URL is served the same local `json-render/image.svg`.
URL correctness is still checked. Google fonts are blocked consistently. These
timings exclude external font/CDN latency and realistic photo decoding. Each trial
gets a fresh 1280×900 Chromium context, fixed date/time zone, and loaded page assets
before the timed submit. Provider caching is allowed and reported when available.

## Inspect results

Each ignored `results/<timestamp>-<mode>/` directory contains:

- `manifest.json`: framework, patch, source hashes, fixture/prompt hashes, versions,
  environment, prices and route settings.
- `schedule.json`, `trials.json`, `summary.json`, `promptfoo.json`.
- Per-trial raw JSONL, reconstructed spec, sanitized model request and provider
  events, usage, browser observations, action events/requests, HTML, screenshot,
  and Playwright trace. API credentials and authorization headers are not saved.

```sh
python3 summarize.py results/<run-directory>
pnpm regrade results/<run-directory>
PROMPTFOO_CONFIG_DIR=.promptfoo PROMPTFOO_DISABLE_TELEMETRY=1 pnpm exec promptfoo view --port 15500 --no
pnpm exec playwright show-trace results/<run-directory>/<trial>/trace.zip
```

The Promptfoo `latency` column includes browser startup, capture and action
verification. **Use `metadata.browser` and the trial export for user-facing timing**:
`firstMeaningful`, `usable`, `streamEnd`, `finished` are milliseconds from submit.
Provider first-text/finish timings use a separate server clock. Actions are
disabled by the app until EOF, so usable time cannot precede stream completion.
An output that creates its root or data late may show nothing until near EOF even
when the streaming renderer is working correctly.

## Limits of this first pilot

Raw JSONL and catalog validation, required numeric metrics, image identity, record
order, and actual action dispatch are checked separately. The DOM checks expect
the example's metric components and identifiable record headings/containers.
Alternative valid layouts or wording can cause false negatives; broad prose
checks can miss mistakes. Every live trial needs an accompanying manual review
against the frozen input, including its screenshot and action trace. Preserve the
original automatic verdict and record corrections separately.

This does not yet cover all six cases, other frameworks, complete journeys,
mobile viewports or local models. Eighteen attempts establish instrumentation;
they do not justify a publishable model ranking. The protocol in `README.md`
defines the larger comparison and confirmation work.
