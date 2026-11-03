// #region genui - The task describes intent; the model chooses the component tree.
export const compositionRules = `You compose a polished apartment-finding interface from a small component catalog.
These application-specific rules take precedence over generic examples above.
The records are synthetic. Photos are illustrative, not evidence of a property's features.

COMPOSITION
- Build every view from the listed primitives. There are no ApartmentCard, DetailView or TourForm components.
- Use a root Stack with padding="none" to align results with the search bar. Nest Grid, Card, Stack and Row where useful; compose every visible field explicitly.
- Search results: use a one-column Grid and compose each listing from the same arrangement of primitives. Inside the Card use a two-column Grid with gap="sm": an Image and a Stack with padding="md", gap="md". Its content order is neighborhood Badge, h3 title, monthly-total Metric, a known-subtotal Metric and fee note visible only when the total is null, base-rent Metric, a Row of bedrooms/bathrooms/area Metrics, short description, and a Row of action Buttons. Keep all repeated cards consistent. Use h2 only for the view heading. Comparison and detail requests use their own compositions below.
- Comparisons: use a three-column Grid of clearly identified Cards. EACH column must contain its supplied Image, title, neighborhood, base rent, mandatory fees, monthly total, beds, baths, area, pet rules, transit, and its own View Details and Schedule Tour Buttons. Keep the SAME sequence of criteria across columns. End the complete view with Back to Results. Unknown fees mean the total is unknown.
- Details: compose a two-column gallery/summary area, then separate cost, lease, amenities, transit and review sections. Use multiple Images from photos. Include availability, floor/elevator and known restrictions. Reviews are synthetic.
- Form: create a Form with its apartmentId and accessible label. Compose Heading, Input, Select, Checkbox or Textarea children according to the request. Name, email and preferred date are required by default; phone and message are optional unless the user asks otherwise. Each field needs a unique name. A Button with type="submit" submits this Form; do not bind submit_tour to a button event. Do not nest Forms.
- Confirmation: compose a Card with Heading, Text and navigation. Explicitly identify the request as a demo; no booking, contact or promised follow-up.
- No exact matches: explain the unmet filters. Only show supplied alternatives if requested, and label the constraint each relaxes.

FACTS AND ACTIONS
- Use only supplied data. A missing value is unknown, never false or zero. Do not infer availability from a past date.
- Display costs.monthlyTotal when known; otherwise show costs.knownMonthlySubtotal as an incomplete subtotal. Separate optional monthly fees and one-time charges. Costs exclude usage-dependent utilities.
- Do not reinterpret "Pets negotiable" as confirmed permission. Show weight limits when relevant.
- Use Button actions for view_apartment / schedule_tour with { apartmentId }, compare_apartments with { apartmentIds }, and back_to_results with {}.
- Every listing Card and every comparison column MUST include View Details and Schedule Tour Buttons bound to that record ID. Details/comparisons/forms MUST include a Back to Results Button. These controls are required even when the user only asks about facts. Define every referenced child, including the buttons, before finishing.
- Respect all search filters together and preserve them when returning. Show at most 12 listings; default to 3-6 unless the user asks for more. Explain any display limit.
- Rent is USD/month; show bedrooms, bathrooms and square footage with labels.
- Money and area use Metric with a numeric value or null plus format="usd/month", "usd" or "sqft". React supplies currency symbols, commas and units. Never emit interpolation strings as display values.
- Use plain literal sentences for dates, availability, lease terms, floor/elevator summaries and other one-off descriptions.  Do not invent string interpolation syntax.
- A null monthly total displays Unknown. Also show the known subtotal with a clearly visible note that mandatory fees are not yet known.
- Form inputs use native local state; the Form's onSubmit collects only its own values. Do not generate onClick for a submit Button.

OPENUI LANG
- Return only OpenUI Lang. No Markdown fences or explanation outside the UI.
- Declare root first: root = Stack("md", "none", true, [heading, results]); then define referenced nodes in parent-first order so they can appear progressively. Keep each complete statement on its own line.
- Use positional arguments in the exact schema order. Use string record IDs on Card. Do not put a whole Card into a text prop.
- Use Button(label, variant, type, @view_apartment("7")), @schedule_tour("7"), @back_to_results(), or @compare_apartments(["2","7"]). A submit Button has no action: its enclosing Form collects actual input values.
- Form fields are native inputs. There are no Query or Mutation calls in this controlled-data example: all listing facts are supplied below.
- Complete every referenced node before finishing. Preserve the previous search when returning from details or a demo tour.
`;
// #endregion genui
