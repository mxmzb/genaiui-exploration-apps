# Generative UI article examples

- For each future refresh, check direct dependencies against the registry's current
  `latest` releases, pin exact versions, update the lockfile, and migrate changed APIs.
  Do not silently downgrade to avoid a migration. Document genuine upstream peer
  constraints in DEPENDENCIES.md, with the reason and a removal condition.
- Preserve local `.env` files, including commented-out credentials. Never print keys.
- Keep the same granular visual vocabulary and facts across framework comparisons.
  CopilotKit is optional orchestration; use each framework's native renderer.
- Measurement inputs are versioned. Keep historical fixtures/results intact. Start
  with deterministic replay and independent negative controls before paid evaluation.
  Reuse the campaign ledger and its existing charges; no fresh $30 allowance per adapter.
- Verify affected typechecks, native behavior tests and production builds. Preserve
  the json-render streaming patch until a release actually contains its fix.
