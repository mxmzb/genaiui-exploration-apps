# Compositional UI: the example before the benchmark

Working brief from the October 31, 2026 feedback. Catalogs, data and v2 fixtures
implemented November 1. Functional verification and observed live model failures
are recorded in [the verification note](compositional-verification.md); the
measurement runner remains pending in README.md.
This brief supersedes the v1 component granularity and nine-listing workload;
the cost, timing, evidence and uncertainty rules in README.md still apply.

## Purpose

Compare how frameworks and models compose a useful interface from a bounded
design system. Filling the props of a prebuilt apartment card is insufficient
coverage for the series. More records alone would only repeat that workload.

The next milestone is a representative json-render example, followed by the
18-trial measurement pilot. Refresh the other frameworks against the same
component capabilities and task requirements once this example is verified.

## Baseline before this change

- `ApartmentCard` renders the photo, neighborhood, price, title, stats and
  description inside React. The model supplies their props and action children.
- `TourForm` renders all five fields inside React. The model only supplies the
  apartment identity and buttons.
- `DetailView` already accepts separate image, stats, description, tag groups
  and action children, but also fixes part of the layout.
- Both json-render catalogs instruct the model to use literal props. The
  standalone app puts all nine records in its prompt and caps results at six.
- Existing records already include availability, pet policy, amenities,
  transit and reviews. Those facts are underused in the required tasks.
- The submit handler currently reads the first form in a rendered view. It must
  target the submitted form if the new catalog permits multiple form instances.

## Model responsibility and component boundary

React owns visual tokens, responsive behavior, accessibility and input mechanics.
The model owns composition: selecting components, connecting their children,
grouping information, choosing bounded layout variants, and binding actions to
the correct records. Generated form fields must also carry the right names,
types, labels, required state and initial values.

Start with approximately 18 components:

| Purpose | Components |
| --- | --- |
| Layout | Stack, Row, Grid, Card, Divider |
| Content | Heading, Text, Image, Badge, Metric, List, ListItem |
| Interaction | Button, Form, Input, Select, Checkbox, Textarea |

`Card` is a styled container with children. It does not accept apartment data or
silently create its contents. `Form` supplies submission and validation behavior;
fields are separate model-generated children. Input types include email, tel and
date. Small semantic components such as Metric are appropriate reusable pieces.
The count is a working budget, not a requirement to invent unused widgets.

One valid composition, not a canonical tree required by the grader:

```text
Grid
  Card
    Image
    Stack
      Row
        Badge (neighborhood)
        Metric (monthly cost)
      Heading (listing title)
      Row
        Metric (beds)
        Metric (baths)
        Metric (area)
      Text (description)
      Row
        Button -> view_apartment(id)
        Button -> schedule_tour(id)
```

Keep the existing City Guide presentation. Bounded variants such as a compact
row or a two-column grid can preserve that visual quality without exposing raw
CSS, arbitrary HTML, or executable code. No whole-card, whole-comparison or
whole-tour-form component may substitute for the composition in scored runs.

## Workloads with a reason to change the composition

Retain six controlled-generation cases, with new versioned IDs and expectations:

| v2 case | Required behavior |
| --- | --- |
| C01 — one listing | Compose a card from separate content, layout and action nodes. |
| C02 — compare three | Align three supplied apartments by the requested criteria, including monthly costs and relevant restrictions; preserve the property associated with every value and action. |
| C03 — twelve results | Complete a dense result view with correctly ordered records, repeated nested components and per-record actions. |
| C04 — rich details | Compose a gallery, summary, cost breakdown, availability, amenities, transit, review information and actions into coherent sections. |
| C05 — no exact match | Explain the supplied unmet constraints. If supplied alternatives are requested, distinguish which constraint each relaxes; never label them exact matches. |
| C06 — generated form | Compose fields and action bindings from the requested field schema. Exercise a changed field requirement so a fixed React form cannot satisfy every variant. |

For C02 and C04, permit multiple layouts that meet the semantic requirements.
Use scenario-specific required facts rather than demanding every dataset field
on every card. Missing facts remain unknown. User preferences can legitimately
change which facts the model emphasizes.

The two journey families remain search/refine/inspect/return and demo tour
submission with invalid inputs. Add comparison to the former where required by
the task. Browser checks cover generated fields, record-specific actions,
preserved filters, keyboard use and responsive overflow. Field validation stays
local; a demo submission must not contact a property owner.

The pilot remains two models × C01/C02/C04 × three repetitions = 18 trials.
This now covers simple composition, comparison, and rich nested detail. Test the
other cases with controlled responses before expanding live runs.

## Data: more variation, with a bounded size

Target 36 synthetic listings across the existing five fictional neighborhoods:
Arts District, Financial District, Historic Heights, Midtown and Riverside.
Preserve existing IDs where practical, but regenerate every selection oracle
against the new snapshot.

Use structured data for:

- rent, mandatory recurring fees, optional costs and move-in charges;
- bedrooms, bathrooms, area, floor and elevator information;
- availability and lease terms;
- pet permissions and restrictions;
- amenities, transit walking times, reviews and illustrative photo galleries.

Include useful differences: studios and larger homes, walk-ups and elevators,
missing reviews, unknown availability, different pet restrictions, and units
whose base-rent order differs from their total-monthly-cost order. Unknown values
must not become false, free or unavailable. Keep prices, reviews and availability
explicitly synthetic; illustrative photos do not verify listing facts.

Calculate derived costs in shared deterministic code and provide the results to
the generation task. The primary comparison measures presenting and connecting
the supplied facts, rather than introducing an unannounced arithmetic test.
Distinguish mandatory monthly costs from optional parking, pet-dependent costs
and one-time deposits. Do not describe an incomplete total as an exact total.

Dataset size and rendered result count are separate axes. Thirty-six searchable
records do not require sending or rendering all thirty-six on every turn. Supply
selected records for controlled generation; document the retrieval path for
journeys. Prompt sizes, output lengths and call counts remain part of the result.

## Evidence and fairness

Record node count, maximum nesting depth, component types used and the number of
records rendered as workload descriptors. More nesting is not a quality score.
Do not reward gratuitous nesting or require identical node counts across formats.

Score required facts, relationships, visible states and working actions, allowing
equivalent valid compositions. Check record scoping, missing references, nested
actions and input associations. Any exact-tree fixture is a renderer test, not
the sole acceptable model answer. Keep visual review separate from deterministic
task correctness; a screenshot alone cannot establish usability.

Expose equivalent component capabilities in all four frameworks, expressed
idiomatically. The same framework comparison must not give one model a prebuilt
card while another has to compose it. Keep the old coarse catalog available in
history; an optional granularity experiment can be specified later, outside the
primary matrix.

## Implementation order and completion

1. Replace coarse components in json-render standalone; verify nested listing,
   comparison, rich detail and generated form with deterministic responses.
   Keep functional source readable and retain the article region markers.
2. Expand and seed the shared data, then verify filtering, derived values and
   unknown-value behavior. Preserve compatibility for consumers being refreshed.
3. Update the json-render CopilotKit catalog, registry and generator instructions
   to avoid leaving that example on the old component contract. Its integration
   remains supporting material rather than an extra mandatory benchmark axis.
4. Freeze v2 data, six cases and fresh confirmation variants with independent
   expected results. The current v1 fixtures remain historical smoke tests.
5. Wire Promptfoo to the real generation path and browser observations, estimate
   a bounded pilot, then inspect all 18 trial records.

The representative-example milestone is complete when the model can produce
different meaningful compositions from the small catalog, every required action
and generated field works, the richer data is used accurately, and desktop/mobile
views remain polished. No new benchmark scores are implied by this brief.
