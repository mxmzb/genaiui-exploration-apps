# Hashbrown + CopilotKit

Try http://127.0.0.1:3005/. Node 24.20+, pnpm 12.9.1.

```sh
pnpm install
MODEL=openai/gpt-5.4 OPENROUTER_PROVIDER=azure/eu node --env-file=../json-render-standalone/.env node_modules/vite/bin/vite.js dev --host 127.0.0.1 --port 3005
pnpm typecheck
pnpm test
pnpm build
```

The env file needs OPENROUTER_API_KEY. Existing env files and their commented
credentials are preserved. Use the shared funded key locally; never commit it.

- `src/lib/catalog.ts`: 18 Skillet component contracts, with native
  `createUiJsonSchema` for the server. There are no predesigned listing cards.
- `src/lib/components.tsx`: small React renderers, native `exposeComponent`,
  numeric formatting and record-scoped navigation / actual form values.
- `src/components/Workspace.tsx`: `useUiKit`, `useJsonParser` and `kit.render`.
  Text props stream; incomplete props use native fallback rendering. Parent
  props precede children. Controls are disabled until the view finishes.
- `src/lib/runtime.ts`: CopilotKit BuiltInAgent and in-memory conversation state.
  OpenRouter receives Hashbrown's generated schema as strict structured output.
  One model step, no automatic retries, no retrieval/tool loop.

The city-guide shell and 36 synthetic listings match the other examples. Photos
are illustrative. Tour requests demonstrate a form; they do not book or contact
anyone. `/canvas` aliases the same app. `agent/` is historical and not needed.

The standalone sibling shares the catalog/shell but uses HashbrownProvider,
useUiChat and HashbrownOpenAI instead of CopilotKit. Benchmark coverage currently
uses the CopilotKit path; the two orchestration paths are not pooled.

Run replay and the bounded live pilot from `../benchmarks`; see its
`hashbrown/README.md`. Dependency constraints are in `../DEPENDENCIES.md`.
