# Next Place · json-render + CopilotKit

The same apartment-finder presentation backed by CopilotKit and a Python LangGraph agent. The orchestrator calls `get_apartments` and `generate_ui`; the latter returns a complete JSONL spec. This example buffers that inner model call and does not demonstrate progressive tool-result streaming.

## Run

Use Node 24, pnpm 12, Python 3.12+, and uv.

From the repository root:

```sh
cd db
pnpm install
cd ../json-render-copilotkit
pnpm install
cp .env.example .env
cd agent
uv sync --frozen
cd ..
```

Set `OPENAI_API_KEY` in `json-render-copilotkit/.env`. Then start two terminals in this folder:

```sh
pnpm agent
```

```sh
pnpm dev
```

The agent runs on **127.0.0.1:8123**. The app runs at **http://127.0.0.1:3005**; its workspace is **/canvas**.

`pnpm agent` regenerates the Python generator's prompt from the TypeScript catalog before starting. Run `pnpm generate-prompt` again after changing the catalog while the agent is already running.

Optional settings:

- `MODEL`: orchestrator model, default `gpt-4.1`.
- `UI_MODEL`: generator model, defaults to `MODEL`.
- `AGENT_URL`: runtime's agent address, defaults to `http://127.0.0.1:8123`.
- `OPENAI_BASE_URL`: an OpenAI-compatible endpoint for the Python model clients.

## Read the example

- `src/lib/catalog.ts`: component vocabulary and generated prompt.
- `src/lib/registry.tsx`: presentation components.
- `src/components/SpecView.tsx`: shared renderer boundary and validated form actions.
- `src/components/ChatView.tsx`: agent messages and conversation/workspace views.
- `src/lib/parse-spec.ts`: JSONL parsing with syntax repair for recoverable model errors.
- `src/routes/api/copilotkit/$.ts`: local CopilotKit runtime.
- `agent/main.py`: orchestration and tools.
- `agent/src/generate_ui.py`: the inner model call.
- `scripts/generate-prompt.ts`: TypeScript-to-Python prompt export.

## Check

```sh
pnpm typecheck
pnpm exec tsx --test tests/parse-spec.test.ts
pnpm build
pnpm peers check
```

For a controlled UI check, start the fixture provider from the sibling standalone app:

```sh
cd ../json-render-standalone
pnpm fixture
```

Then, in two terminals in this app's folder:

```sh
pnpm agent:fixture
```

```sh
pnpm dev:fixture
```

Open **http://127.0.0.1:3015**. This exercises the actual CopilotKit runtime, LangGraph tools, and renderer using scripted model responses, not live generation. Check listing → detail → required form fields → demo confirmation → back to results, plus a fresh thread and workspace mode. See the standalone README for responsive checks.

No real booking is created. Controlled results do not establish model reliability, speed, or cost. Count all orchestration and generation calls when implementing the separate benchmark work.

The parser regression covers a missing closing brace captured during live testing. Syntax repair does not establish semantic correctness. Benchmarks should distinguish raw JSON validity from a usable interface after repair.

## Dependency notes

The lockfiles record the refreshed JavaScript and Python versions. Nitro's current `latest` tag is a release candidate. The `ws` override satisfies the installed OpenAI client's peer requirement; it is not an application API.

## Compositional workload

The model chooses the tree: Grid/Stack/Row/Card containers, Heading/Text/Image/Badge/Metric/List content, and individual fields in Form containers. Cards accept no listing data; forms contain no hardcoded field list. A comparison can use a different tree from search results or rich details.

Search results use native repeat/state bindings over a single generated card subtree. Metric formats numeric money and area in React. Repeated action IDs use an ID template; a bare `$item` action parameter resolves to a state path in json-render 0.21.

The shared seed contains 36 synthetic records across five neighborhoods. It includes galleries, required and optional fees, derived fixed costs, lease terms, pet restrictions, transit and reviews. Unknown availability and fees remain unknown. Photos are illustrative. Run `pnpm seed` from `../db` after pulling data changes, then restart the app/agent to clear cached data.

Try comparing apartments 2, 7 and 13: base rent and mandatory monthly total produce different orderings. Open the details for apartment 12 to exercise unknown fees/availability and missing reviews. Ask for a tour form with a required phone number and tour-format choice to change the generated field structure.

The [v2 benchmark fixtures](../benchmarks/v2/) cover one listing, a three-listing comparison, twelve results, rich details, no exact match and a generated form. They are checked data, not model results.
