# json-render instrumentation pilot

Run: `2026-11-01T02-08-55-143Z-live`.

This is an instrumentation pilot, not a model ranking. Success counts use the saved-output review when available; the original automatic verdicts remain below.

| Model / pinned route | Reviewed success (Wilson 95%) | Recorded charge | Mean per attempt | Cost per reviewed success | Median browser stream completion, all attempts |
|---|---:|---:|---:|---:|---|
| openai/gpt-4.1 / azure/swedencentral | 2/9 (6–55%) | $0.28661 | $0.03185 | $0.14331 | 10.96s (n=9) |
| google/gemini-3.8-flash / google-vertex/us | 9/9 (70–100%) | $0.18770 | $0.02086 | $0.02086 | 26.17s (n=9) |

All failed generation attempts are included in costs. Missing charges remain unknown; no-success cost is undefined. Stream completion is diagnostic transport timing, not time to a correct, usable interface. Provider routing and configuration differ; do not infer model superiority from nine attempts.

## Review and instrumentation corrections

Original automatic passes: 5/18. Reviewed passes: 11/18. Six content-check false negatives were corrected by replaying saved DOM, with no model calls or output repair.

Codex (agent review, not an independent human or blinded review)

Inspected all 18 final screenshots, raw-format/catalog verdicts, rendered text and values against frozen inputs, resolved action events and handler requests. No external judge calls. Prose review remains fallible. Model identity was visible; this does not satisfy the blinded confirmation-review requirement.

The initial first-meaningful probe checked heading visibility but not metric visibility. Its viewport criterion has since been tightened. Six corrected task passes have no original usable timestamp. Original pilot timings are diagnostic; offline regrading cannot establish live usable times. Do not publish a speed ranking from this pilot.

[Per-trial review](manual-review.json) · [Offline checker results](regrade.json). Original trial/export hashes are retained.

2026-11-01T02-07-30-858Z-live: 18 OpenRouter HTTP 404 pre-inference ZDR rejections retained separately; no generation IDs/usage returned. Not part of this 18-generation model-quality cohort.

## Original automatic verdicts

| Trial | Format | Catalog | Content | Actions | Route | Runtime | Charge | Screenshot / trace |
|---|---|---|---|---|---|---|---:|---|
| [01-C02-openai-gpt-4.1](01-C02-openai-gpt-4.1/trial.json) | fail | fail | fail | fail | pass | pass | $0.04756 | [image](01-C02-openai-gpt-4.1/final.png) · [trace](01-C02-openai-gpt-4.1/trace.zip) |
| [02-C01-google-gemini-3.8-flash](02-C01-google-gemini-3.8-flash/trial.json) | pass | pass | pass | pass | pass | pass | $0.01095 | [image](02-C01-google-gemini-3.8-flash/final.png) · [trace](02-C01-google-gemini-3.8-flash/trace.zip) |
| [03-C01-openai-gpt-4.1](03-C01-openai-gpt-4.1/trial.json) | fail | fail | pass | fail | pass | pass | $0.02906 | [image](03-C01-openai-gpt-4.1/final.png) · [trace](03-C01-openai-gpt-4.1/trace.zip) |
| [04-C04-google-gemini-3.8-flash](04-C04-google-gemini-3.8-flash/trial.json) | pass | pass | fail | pass | pass | pass | $0.02674 | [image](04-C04-google-gemini-3.8-flash/final.png) · [trace](04-C04-google-gemini-3.8-flash/trace.zip) |
| [05-C02-google-gemini-3.8-flash](05-C02-google-gemini-3.8-flash/trial.json) | pass | pass | fail | pass | pass | pass | $0.02769 | [image](05-C02-google-gemini-3.8-flash/final.png) · [trace](05-C02-google-gemini-3.8-flash/trace.zip) |
| [06-C04-openai-gpt-4.1](06-C04-openai-gpt-4.1/trial.json) | pass | fail | fail | pass | pass | pass | $0.03731 | [image](06-C04-openai-gpt-4.1/final.png) · [trace](06-C04-openai-gpt-4.1/trace.zip) |
| [07-C01-openai-gpt-4.1](07-C01-openai-gpt-4.1/trial.json) | pass | pass | pass | pass | pass | pass | $0.01848 | [image](07-C01-openai-gpt-4.1/final.png) · [trace](07-C01-openai-gpt-4.1/trace.zip) |
| [08-C01-google-gemini-3.8-flash](08-C01-google-gemini-3.8-flash/trial.json) | pass | pass | pass | pass | pass | pass | $0.01392 | [image](08-C01-google-gemini-3.8-flash/final.png) · [trace](08-C01-google-gemini-3.8-flash/trace.zip) |
| [09-C04-openai-gpt-4.1](09-C04-openai-gpt-4.1/trial.json) | pass | fail | fail | pass | pass | pass | $0.03107 | [image](09-C04-openai-gpt-4.1/final.png) · [trace](09-C04-openai-gpt-4.1/trace.zip) |
| [10-C02-google-gemini-3.8-flash](10-C02-google-gemini-3.8-flash/trial.json) | pass | pass | fail | pass | pass | pass | $0.02334 | [image](10-C02-google-gemini-3.8-flash/final.png) · [trace](10-C02-google-gemini-3.8-flash/trace.zip) |
| [11-C04-google-gemini-3.8-flash](11-C04-google-gemini-3.8-flash/trial.json) | pass | pass | fail | pass | pass | pass | $0.02398 | [image](11-C04-google-gemini-3.8-flash/final.png) · [trace](11-C04-google-gemini-3.8-flash/trace.zip) |
| [12-C02-openai-gpt-4.1](12-C02-openai-gpt-4.1/trial.json) | fail | fail | fail | fail | pass | pass | $0.03367 | [image](12-C02-openai-gpt-4.1/final.png) · [trace](12-C02-openai-gpt-4.1/trace.zip) |
| [13-C02-openai-gpt-4.1](13-C02-openai-gpt-4.1/trial.json) | fail | fail | fail | fail | pass | pass | $0.03499 | [image](13-C02-openai-gpt-4.1/final.png) · [trace](13-C02-openai-gpt-4.1/trace.zip) |
| [14-C02-google-gemini-3.8-flash](14-C02-google-gemini-3.8-flash/trial.json) | pass | pass | fail | pass | pass | pass | $0.02141 | [image](14-C02-google-gemini-3.8-flash/final.png) · [trace](14-C02-google-gemini-3.8-flash/trace.zip) |
| [15-C04-openai-gpt-4.1](15-C04-openai-gpt-4.1/trial.json) | pass | pass | pass | pass | pass | pass | $0.03580 | [image](15-C04-openai-gpt-4.1/final.png) · [trace](15-C04-openai-gpt-4.1/trace.zip) |
| [16-C04-google-gemini-3.8-flash](16-C04-google-gemini-3.8-flash/trial.json) | pass | pass | fail | pass | pass | pass | $0.02880 | [image](16-C04-google-gemini-3.8-flash/final.png) · [trace](16-C04-google-gemini-3.8-flash/trace.zip) |
| [17-C01-google-gemini-3.8-flash](17-C01-google-gemini-3.8-flash/trial.json) | pass | pass | pass | pass | pass | pass | $0.01087 | [image](17-C01-google-gemini-3.8-flash/final.png) · [trace](17-C01-google-gemini-3.8-flash/trace.zip) |
| [18-C01-openai-gpt-4.1](18-C01-openai-gpt-4.1/trial.json) | fail | fail | pass | fail | pass | pass | $0.01868 | [image](18-C01-openai-gpt-4.1/final.png) · [trace](18-C01-openai-gpt-4.1/trace.zip) |

## Reproduce this report

`python3 summarize.py results/2026-11-01T02-08-55-143Z-live`

Trial-export SHA-256: `96c7e894cad07e2f7306701be3b3b4df42385297795de27acc90093e55c9d400`.

The manifest records implementation/patch hashes, environment, prices and settings. Screenshots use local synthetic image fixtures. See RUNNING.md for measurement definitions and limitations.
