# OpenUI helpers worth covering in the article

Checked against official docs and installed releases on 2026-11-02.

| Package or API | Current use / value | Measurement implication |
| --- | --- | --- |
| `@openuidev/react-lang` 1.0.2 | Native renderer, catalog prompt generation, typed custom actions, diagnostics. This is the core of both examples. | Measure the generated language and native parser behavior; no sanitizer. |
| `@openuidev/lang-core` 1.0.2 | Headless parser and evaluator used by the benchmark's contract/action checks. | Check the same parser version as the app, then grade visible facts independently. Parser acceptance is not proof of correct UI. |
| `@openuidev/react-headless` 0.18.1 | Used in the standalone example: ChatProvider, fetchLLM, OpenAI stream adapter and conversation hooks. Other adapters include AG-UI and Vercel AI. | Replaces handwritten chat/SSE state. It is an alternative conversation owner to CopilotKit, not an extra layer on top of it. |
| `@openuidev/devtools` 0.3.1 | Development inspector, with CDN version explicitly pinned. The library also auto-mounts it in development; a disabled manual wrapper does not suppress that instance. Automatic opening disabled; excluded from benchmark production builds. | Useful for explaining parser errors, streaming and actions without inventing debugging infrastructure. It loads a CDN widget; installing the wrapper alone does not bundle the entire inspector. |
| `@openuidev/observability` 0.0.4 | Supplies the underlying native event stream consumed by devtools. Not added as a redundant direct dependency yet. | Useful for a future event breakdown. Browser-visible timing remains the main UX evidence. |
| `@openuidev/react-ui` 0.18.1 | Prebuilt chat and component UI. Removed from this example's active dependencies in favor of the matched custom catalog. | A useful convenience path to explain, but a different catalog would confound the framework comparison. |
| `@openuidev/server` 0.3.0 | Optional hosted Autofix helpers for OpenAI/Vercel streams. Not enabled in the baseline. Requires a Thesys API key. | A separate recovery experiment: count the extra service call, latency, cost and success after repair separately from first-attempt reliability. |

Native APIs also worth an article sidebar:

- `defineAction` replaces colon-delimited action strings with named, schema-defined
  parameters. Form submission uses a native custom ActionPlan and actual form values.
- `Renderer.onError` and `onParseResult` expose native diagnostics. We use onError
  for app failures and the headless parser for saved benchmark diagnostics.
- `Renderer.Root/Content/QueryLoading/QueryError/Retry` and `useRendererQuery` handle
  data-source loading and retry if an example uses native Query/Mutation. They do
  not repair an invalid model-generated program.
- `createLibrary().extend()` can add/override/remove catalog entries without copying
  a prebuilt library. Useful when demonstrating a tailored product catalog.
- `defineFunction` can provide typed local computation/formatting. Our matched
  catalog keeps numeric price formatting in React so all frameworks have the same
  display responsibility; no model-produced currency interpolation.
- Native Query/Mutation and MCP tool providers are interesting for the later
  complete-interaction experiment. The controlled generation baseline supplies
  records up front, so adding retrieval calls here would change the experiment.

Sources: [React Lang API](https://www.openui.com/docs/api-reference/react-lang),
[Headless chat API](https://www.openui.com/docs/api-reference/react-headless),
[Devtools](https://www.openui.com/docs/api-reference/devtools),
[Autofix server helpers](https://www.openui.com/docs/api-reference/server),
[package overview](https://www.openui.com/docs/api-reference).
