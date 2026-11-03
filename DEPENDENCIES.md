# Dependency refresh — 2026-11-02

Checked 51 unique direct dependency names across all 10 JavaScript packages against the npm registry `latest` tags. Manifests pin exact versions; lockfiles were regenerated with pnpm 12.9.1. Checks run on Node 24.20.0.

## Current primary versions

| Package | Version |
| --- | --- |
| `react` | 19.3.1 |
| `react-dom` | 19.3.1 |
| `vite` | 8.3.5 |
| `typescript` | 7.0.2 |
| `@tanstack/react-start` | 1.169.4 |
| `@tanstack/react-router` | 1.170.46 |
| `nitro` | 3.0.261029-rc |
| `@copilotkit/react-core` | 1.83.0 |
| `@copilotkit/runtime` | 1.83.0 |
| `@openuidev/react-lang` | 1.0.2 |
| `@openuidev/lang-core` | 1.0.2 |
| `@openuidev/react-headless` | 0.18.1 |
| `@openuidev/devtools` | 0.3.1 |
| `@json-render/core` | 0.21.4 |
| `@json-render/react` | 0.21.4 |
| `@a2ui/react` | 0.14.0 |
| `@a2ui/web_core` | 0.14.0 |
| `@hashbrownai/core` | 0.8.3 |
| `@hashbrownai/react` | 0.8.3 |
| `@hashbrownai/openai` | 0.8.3 |
| `promptfoo` | 0.125.1 |
| `playwright` | 1.64.1 |
| `openai` | 7.47.0 |
| `ai` | 7.0.159 |
| `@ai-sdk/openai` | 4.0.106 |

## Explicit compatibility exceptions

| Package / app | Pin | Registry latest | Why / removal condition |
| --- | --- | --- | --- |
| `@openrouter/ai-sdk-provider` in A2UI, OpenUI and Hashbrown CopilotKit | 2.10.0 | 3.1.0 | CopilotKit 1.83.0 uses AI SDK 6. Adapter 3 requires AI SDK 7. Upgrade when the runtime accepts that model interface; do not force incompatible peer overrides. |
| `zod` in the older standalone A2UI v0.9 example | 3.25.76 | 4.6.7 | @a2ui/react 0.14.0 requires Zod 3. Upgrade when that renderer supports Zod 4. The CopilotKit A2UI example uses Zod 4 already. |

Nitro’s registry `latest` is still a 3.0 release candidate; it replaces the older nightly alias. A release-age exception is explicit in each app that needs it.

json-render 0.21.4 still contains the streaming mutation behavior covered by our earlier patch. The patch was carried forward and the installed package was checked; do not remove it merely because the version changed. Historical 0.21.3 artifacts remain intact.

The standalone A2UI basic catalog moved to `@a2ui/web_core/v0_9/basic_catalog`; its import and generic catalog type were migrated. Hashbrown 0.8.3 moved model selection server-side and emits AG-UI events, so its standalone endpoint and message narrowing were migrated too. These compatibility changes do not constitute the upcoming Hashbrown design/benchmark refresh.

Install-only telemetry scripts for OpenUI/Hashbrown and Scarf are explicitly disabled. Native SQLite and esbuild build steps are allowed.

All eight app production builds and TypeScript checks pass. Benchmark tests pass; A2UI/OpenUI native behavior tests and json-render catalog/metric tests pass. The older standalone A2UI package declares a Vitest command but contains no tests; its build and typecheck were verified.

This audit covers the JavaScript example apps, database package and benchmark workspace. Retained historical Python agents were not relaunched or dependency-updated in this refresh. Future work should follow AGENTS.md and re-check registry releases instead of assuming these versions stay current.

## Hashbrown follow-up

Rechecked both Hashbrown manifests against registry latest on 2026-11-02. Core,
React and OpenAI adapters remain 0.8.3. The new CopilotKit example shares the
AI SDK 6 / OpenRouter 2.10.0 exception above. The standalone adapter depends on
OpenAI 6.45.x through its declared upstream peer range; this is not a direct app
pin or a forced override. Move to OpenAI 7 when Hashbrown widens that peer range.
Benchmark JSON Schema validation uses current Ajv 8.20.0.

The refreshed Hashbrown apps now use the granular catalog and the same v3 data
as the newer examples. The retained Python agent is historical and not run.
