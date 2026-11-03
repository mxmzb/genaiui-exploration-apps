# Hashbrown browser benchmark

```sh
# From benchmarks/, on Node 24.20+
pnpm hashbrown --mode replay --port 15504
pnpm hashbrown --mode plan
pnpm hashbrown --mode live --max-spend-usd 30 --port 15505
```

Open the printed URL and click Run suite. The $30 is the existing campaign cap,
not a fresh allowance. All adapters share `results/a2ui-campaign-ledger.json`.
Live calls load the existing OpenRouter key from json-render-standalone/.env.

The real CopilotKit app agent receives the real native Hashbrown JSON Schema as
strict structured output. Its model-provider fetch is the replay/live seam.
The browser uses native useJsonParser/useUiKit/kit.render. No custom JSON repair.
Hashbrown's partial prop fallback and streamed text remain active.

Current cases: all six v4 cases. The [shared replay suite](../SIX_CASES.md) includes
eleven negative controls plus actual clicks and form submissions checked at the
server. Ajv checks the exact public createUiJsonSchema output;
a separate tree walk checks record/action association. The common DOM oracle
checks visible facts against versioned records. Native React tests cover nested
partial text, numeric formatting, action dispatch, required fields, scoped form
values and disabled controls. These do not establish full journey pass rates.

Common measurement protocol is in ../MEASUREMENTS.md. Local image substitution,
a fixed viewport and system fonts isolate the renderer. Photo loading is excluded.
Usable time requires complete correct content and enabled correctly bound actions.
Fixtures and source hashes are recorded; never compare replay delivery speed to
model latency. Two live generations are wiring checks, not a model ranking.

The standalone Hashbrown transport is a separate Responses-API path. Its manual
smokes are separate artifacts, not pooled into the Chat Completions baseline.

Primary references:
- https://hashbrown.dev/docs/react/recipes/ui-kits
- https://hashbrown.dev/docs/react/concept/streaming
- https://hashbrown.dev/blog/2026-10-22-hashbrown-v-0-8-0

Potential later article experiments: full catalog vs native UI-kit selection,
streaming text vs atomic prop completion, and built-in Hashbrown orchestration
vs CopilotKit. Those add different model calls/prompts; measure their cost and
latency explicitly before making claims. They are not enabled in this baseline.
