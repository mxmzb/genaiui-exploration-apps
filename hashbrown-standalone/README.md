# Hashbrown standalone

Try http://127.0.0.1:3006/ (also `/canvas`).

```sh
pnpm install
MODEL=openai/gpt-5.4 node --env-file=../json-render-standalone/.env node_modules/vite/bin/vite.js dev --host 127.0.0.1 --port 3006
pnpm typecheck
pnpm build
```

Use Node 24.20+ and OPENROUTER_API_KEY. The native `HashbrownProvider` +
`useUiChat` path renders the same exposed components as the CopilotKit sibling.
The server uses `HashbrownOpenAI.stream.text` with OpenRouter's Responses API.
The server owns the facts, prompt and native response schema. It disables tools
for this controlled-data comparison. Requests pin Azure/eu with no provider
fallback, low reasoning and 16,000 maximum output tokens.

`HASHBROWN_API_BASE` is an optional compatible Responses endpoint (default
https://openrouter.ai/api/v1). Shared React modules live in the sibling app;
Vite dedupes React and Hashbrown. Install both siblings before running.

All listings are synthetic; forms demonstrate a request without booking or
contacting anyone. The old sandbox/tool-driven UI is replaced by the shared
18-primitive catalog, so the generated composition itself is visible.

Promptfoo currently measures the CopilotKit transport. Standalone behavior is
smoke-tested separately; those runs are not interchangeable benchmark data.
