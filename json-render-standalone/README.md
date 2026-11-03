# Next Place · json-render standalone

An apartment-finder example with a conversation view and a persistent workspace. The model composes 18 layout, content and input primitives. React owns visual tokens, responsive behavior, native validation and action dispatch. There are no prebuilt apartment cards, detail screens or tour forms. Listings are sample data. Tour requests are demonstrations and do not create bookings.

## Run

Use Node 24 and pnpm 12.

From the repository root:

```sh
cd db
pnpm install
pnpm seed
cd ../json-render-standalone
pnpm install
cp .env.example .env
```

Set `OPENAI_API_KEY` locally, then run `pnpm dev`. Open **http://127.0.0.1:3002** (conversation) or **http://127.0.0.1:3002/surface** (workspace).

Optional settings:

- `MODEL`: defaults to `gpt-4.1`.
- `MODEL_PROVIDER=openrouter`: uses `OPENROUTER_API_KEY` and OpenRouter; choose a full model ID with `MODEL` (default `openai/gpt-4.1`). Existing OpenAI settings need not be removed. The app selection is for development; the benchmark still needs pinned serving routes and usage capture.
- `APARTMENTS_DB_PATH`: database path, default `../db/apartments.db` relative to the app working directory.
- `OPENAI_BASE_URL`: an OpenAI Chat Completions-compatible endpoint.

Do not commit credentials. A key without available credits cannot run live searches.

## Read the example

| File                                            | Responsibility                                               |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `src/lib/catalog.ts`                            | Component and action schemas; safe for browser imports       |
| `src/lib/registry.tsx`                          | React implementations                                        |
| `src/lib/prompts.ts`                            | Server prompt and sample database data                       |
| `src/lib/generate-ui.ts`                        | Request validation, model call, and streaming error handling |
| `src/components/ApartmentFinder.tsx`            | `useChatUI`, conversation vs. latest-surface presentation    |
| `src/components/SpecView.tsx`                   | Renderer providers and action handling                       |
| `src/components/FinderUI.tsx`, `src/styles.css` | Presentation, separate from the generative UI mechanism      |

The chat hook sends message text, not complete historical specs. Results use native repeat/state bindings over a model-composed card subtree. Metric formats numeric money and area values in React. Repeated actions use an ID template because a bare `$item` in action params resolves to a state path in json-render 0.21. Forms contain model-generated fields with local HTML state; each form collects only its own values.

## Check

```sh
pnpm typecheck
node --test tests/catalog.test.ts
pnpm build
```

Run the built server from this app folder with `node --env-file=.env .output/server/index.mjs`. Keep the sibling `db` folder available, or set `APARTMENTS_DB_PATH` explicitly.

For repeatable browser checks without model calls, start these in two terminals from this folder:

```sh
pnpm fixture
```

```sh
pnpm dev:fixture
```

Open **http://127.0.0.1:3012**. This runs the real app against a local scripted provider on port 9012. Responses explicitly identify themselves as controlled previews. The fixture follows a fixed scenario; it is not a natural-language search engine or evidence of model quality.

Check:

1. Search with “A little room to grow”; inspect the streamed listing cards.
2. View an apartment's details, then open its tour form.
3. Submit an empty form: required fields must prevent a request.
4. Fill in synthetic name/email/date values and submit: the demo confirmation must appear.
5. Return to results, start fresh, and repeat in workspace mode.
6. Repeat at 390px and 320px widths; check keyboard focus and reduced motion.
7. Against the live endpoint, a provider/credit failure must show a readable error and retry control.

The fixture reports zero token usage because it does not call a model. Never use its latency, cost, or pass rate as benchmark data.

## Versions and scope

The manifests and lockfiles pin the refreshed dependencies. Nitro's current `latest` tag is a 3.0 release candidate, replacing the previous nightly alias. Node types follow the Node 24 runtime.

`pnpm install` applies a local patch to `@json-render/react@0.21.3` for [json-render#447](https://github.com/vercel-labs/json-render/pull/447). It copies streamed state before publishing React updates, so repeated items appear before the response ends. Remove the patch after upgrading to a release containing the upstream fix. Benchmark reports using this dependency must identify the patch; its state-copying work is part of the measured implementation.

This is an illustrative local app, not a hosted housing service. The model can make factual or structural mistakes. The article benchmarks and AgentBench retirement are tracked in [maximzubarev#104](https://github.com/mxmzb/maximzubarev/issues/104).

## Compositional workload

The model chooses the tree: Grid/Stack/Row/Card containers, Heading/Text/Image/Badge/Metric/List content, and individual fields in Form containers. Cards accept no listing data; forms contain no hardcoded field list. A comparison can use a different tree from search results or rich details.

The shared seed contains 36 synthetic records across five neighborhoods. It includes galleries, required and optional fees, derived fixed costs, lease terms, pet restrictions, transit and reviews. Unknown availability and fees remain unknown. Photos are illustrative. Run `pnpm seed` from `../db` after pulling data changes, then restart the app/agent to clear cached data.

Try comparing apartments 2, 7 and 13: base rent and mandatory monthly total produce different orderings. Open the details for apartment 12 to exercise unknown fees/availability and missing reviews. Ask for a tour form with a required phone number and tour-format choice to change the generated field structure.

The [v2 benchmark fixtures](../benchmarks/v2/) cover one listing, a three-listing comparison, twelve results, rich details, no exact match and a generated form. They are checked data, not model results.
