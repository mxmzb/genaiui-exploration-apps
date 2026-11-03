# A2UI apartment finder

The series' refreshed A2UI example: a City Guide workspace with 18 small React
components, 36 shared synthetic listings and model-generated layouts, fields and
actions. The model composes every card; there is no `ApartmentCard`, detail-page
or tour-form template.

## Run

Requires Node 24+ and pnpm 12.

```sh
cd ../db
pnpm install
pnpm seed
cd ../a2ui-copilotkit
pnpm install
cp .env.example .env
# Set OPENAI_API_KEY in .env.
node --env-file=.env node_modules/vite/bin/vite.js --port 3003 --host 127.0.0.1
```

Open <http://127.0.0.1:3003>. `/canvas` redirects to the workspace.
If the shared database is already seeded, skip the database commands.
`MODEL` accepts the provider/model names supported by CopilotKit's built-in agent;
the default is `openai/gpt-5.4`. Supply that provider's credentials in the server
environment. The existing json-render `.env` can also be passed to Node's
`--env-file` option without copying or changing any keys.

For OpenRouter, set `MODEL_PROVIDER=openrouter`, `OPENROUTER_API_KEY`,
`MODEL=openai/gpt-5.4` and `OPENROUTER_PROVIDER=azure/eu`.
This route requires zero data retention and disables provider fallbacks. The
OpenRouter SDK is pinned to its current AI SDK 6-compatible major because
CopilotKit 1.83.0 uses AI SDK 6 internally.

## What the example demonstrates

- A2UI 1.0 via CopilotKit 1.83.0's `createGenerativeUI` and `GenerativeUISurface`.
- The same City Guide styles, numeric price formatting and shared listing data
  as json-render. Unknown mandatory fees remain unknown.
- A model-generated repeated card subtree, nested layouts, galleries, comparison
  columns and native form fields. Buttons are generated separately from cards.
- CopilotKit supplies tool-call and Markdown transports, streams the operations, resolves bindings and
  forwards user actions. One built-in agent generates the view directly; there
  is no secondary UI model or separate Python server.
- Details, comparisons and demo tour requests remain in one page target. Form
  submission collects only that form's fields. It makes no booking and sends no
  message to a property owner. Conversations are in memory and reset on restart.

The essential files are `src/lib/catalog.tsx` (schemas and React primitives),
`src/lib/ui-instructions.ts` (application intent),
`src/lib/runtime.ts` (shared app/benchmark runtime), `src/lib/variants.ts` (delivery strategies), and
`src/components/ApartmentFinder.tsx` (page surface and search).

## Version and benchmark boundary

This implements **A2UI 1.0 candidate through CopilotKit's experimental engine**,
not every A2UI feature. The catalog and UI deliberately use the supported
operations, data bindings, repeated children and events. Conditional sections use
A2UI's basic `not` and `required` functions to distinguish unknown costs from zero.
Form fields use native DOM state, collected on submit, rather than A2UI writable
bindings.

The sibling `a2ui-standalone` is the older Google-renderer A2UI 0.9 experiment. It
has not been refreshed by this change and is not an equivalent benchmark target.
The article and future benchmark must name the protocol version and renderer.

Live model output remains probabilistic. Smoke testing this app does not establish
a reliability score. The [Promptfoo A2UI adapter](../benchmarks/a2ui/README.md) checks all eight
transport/update variants with replay and a bounded live pilot. Repeated
cross-model runs remain future work; json-render results do not apply here.

Reference: [CopilotKit's A2UI migration and support matrix](https://docs.copilotkit.ai/generative-ui/components/from-a2ui).

## Check

```sh
pnpm typecheck
pnpm test
pnpm build
```

## Transport and streaming controls

Choose Tool calls or Markdown, then Batch, Component by component, Apartment by
apartment, or Field by field. Switching starts a fresh conversation and updates
the URL. All eight share the same renderer and catalog. Pending values remain
visibly pending while streaming, and actions unlock when the run finishes.
See the [variant definitions and benchmark commands](../benchmarks/a2ui/README.md).
