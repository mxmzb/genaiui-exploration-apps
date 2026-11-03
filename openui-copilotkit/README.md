# OpenUI apartment finder

A city-guide workspace with 36 synthetic listings and 18 granular components.
The model composes layouts, photos, metrics, fees, details, forms and typed actions.
Prices are numbers formatted by React; unknown mandatory fees remain unknown.
Tours are demonstrations: no booking, email or follow-up is sent.

## Run

Use Node 24.20+ and pnpm 12.9.1. Install both OpenUI packages and `../db`
because the two examples share their catalog/workspace source and listing data.

```sh
pnpm install
MODEL_PROVIDER=openrouter MODEL=openai/gpt-5.4 OPENROUTER_PROVIDER=azure/eu COPILOTKIT_TELEMETRY_DISABLED=true node --env-file=../json-render-standalone/.env node_modules/vite/bin/vite.js --port 3004 --host 127.0.0.1
```

The current development key is read from the existing local file above; this does
not modify it. Alternatively use this app's `.env` based on `.env.example`.
`/` and `/canvas` open the same workspace.

## Implementation

- `openui-copilotkit/src/lib/catalog.tsx`: native `defineComponent`, `createLibrary`,
  typed `defineAction` definitions and small React primitives. No ready-made listing cards.
- `openui-copilotkit/src/components/Workspace.tsx`: native OpenUI `Renderer`, parse/runtime
  diagnostics, numeric display and validation of action parameters before dispatch.
- CopilotKit example: `BuiltInAgent` streams OpenUI Lang as assistant text; the provider
  owns conversation, streaming and follow-up requests. A2UI surfaces are not involved.
- Standalone example: OpenUI `ChatProvider`, `fetchLLM` and `openAIAdapter` own conversation
  and consume the server's ordinary Chat Completions SSE stream.
- Both use the same catalog, prompt, visual workspace, dataset and native parser.
- There is no sanitizer, replacement parser, silent retry or hosted repair in the baseline.
  The model emits parent references first; OpenUI resolves content incrementally. Actual
  time to useful content is measured, not inferred from receiving tokens.
- Form validation is native HTML. A valid submit builds a native custom ActionPlan using
  only the submitting form's current values; no invented contact data enters the action.
  Buttons stay disabled until generation completes.
- Development inspector: OpenUI auto-mounts it in development. We configure
  `@openuidev/devtools`, CDN tag pinned to 0.3.1, automatic opening
  disabled. It is omitted from production previews and benchmark builds. The library’s
  auto-mounted instance is not suppressed by a disabled manual wrapper; use production
  preview for a clean reader-facing demo.

## Checks and benchmark

`pnpm typecheck`, `pnpm test`, `pnpm build`.
The shared catalog tests check actual native action dispatch, required fields, and form scope.
See [the Promptfoo adapter](../benchmarks/openui/README.md),
[measurement definitions](../benchmarks/MEASUREMENTS.md), and
[helper-package research](../benchmarks/openui/HELPERS.md).

The previous Python agent is historical; the current example starts with one Node process.

## Reader-facing preview

After `pnpm build`, run the same environment command above with `vite.js preview`
instead of `vite.js`. The production preview retains the server endpoints while
omitting the development inspector. Rebuild after editing source.
