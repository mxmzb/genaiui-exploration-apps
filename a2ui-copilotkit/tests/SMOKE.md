# Refresh smoke checks — 2026-11-01

Manual browser checks, not benchmark results or a reliability estimate.
CopilotKit 1.83.0; A2UI 1.0 candidate; shared 36-listing database.

## Final live route

GPT-5.4 via OpenRouter, provider `azure/eu`, reasoning effort `low`, zero data
retention required and provider fallbacks disabled.

- Twelve apartments sorted by rent: IDs
  `3, 15, 32, 12, 8, 27, 10, 22, 1, 30, 20, 6` in that order. Every card had
  a photo, numeric prices/area, beds, baths and two generated action buttons.
  IDs 12 and 22 showed an unknown total and the correct known subtotal;
  the other ten did not show the unknown-fee warning.
- Search: two 1-bedroom Arts District apartments under $2,300 returned IDs
  10 and 1, sorted by rent.
- First listing's View Details opened ID 10, with gallery, costs, lease,
  amenities, transit and synthetic reviews. Date text rendered without errors.
  Sections appeared before generation finished.
- Schedule Tour generated a form for ID 10. Empty submission triggered native
  required-field validation. Synthetic name/email/date/time/message submitted
  successfully and produced an explicitly demo-only confirmation.
- Back to Results returned to the original filtered search, IDs 10 and 1.
- Form, confirmation and filtered results fit a 390px viewport without
  horizontal overflow. At 1280px, header, composer and results aligned at x=60
  with a width of 1160px. No browser console errors in the final flow.

The comparison of IDs 2, 7 and 13 was also checked with direct OpenAI GPT-5.4:
correct order by monthly total (13, 2, 7), prices, restrictions and actions.

## Engineering checks

- TypeScript and four focused catalog/formatting tests pass.
- Production build passes. Built server returned HTTP 200 for the rendered
  welcome page and runtime info; info exposed the default agent and 1.83.0.
- `git diff --check` passes.

## Limits and observations

Earlier smoke attempts exposed invalid string bindings, incomplete tool calls
and an unsupported date-format expression. The application instructions now
spell out native binding objects, a complete operations array in one `render_ui`
call and plain date text. These are prompt constraints, not automatic repairs.

One Gemini 3.8 Flash attempt via OpenRouter generated an incomplete surface with
placeholder data and no root component. The current engine can leave that case
blank. The final preview uses GPT-5.4; no cross-model reliability claim follows
from these checks. This failure belongs in the future A2UI benchmark rather than
being silently replaced with a hardcoded view.

The direct OpenAI key exhausted its credit balance during testing. The final
live session uses the existing OpenRouter key from the json-render environment;
no key files or commented credentials were changed.
