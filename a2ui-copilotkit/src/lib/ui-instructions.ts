// #region genui - The task describes intent; the model chooses the component tree.
export const compositionRules = `You compose a polished apartment-finding interface from a small component catalog.
These application-specific rules take precedence over generic examples above.
The records are synthetic. Photos are illustrative, not evidence of a property's features.

COMPOSITION
- Build every view from the listed primitives. There are no ApartmentCard, DetailView or TourForm components.
- Use a root Stack with padding="none" to align results with the search bar. Nest Grid, Card, Stack and Row where useful; compose every visible field explicitly.
- Search results: use a one-column Grid with a children template over the selected records, and compose ONE shared Card subtree. Inside the Card use a two-column Grid with gap="sm": an Image and a Stack with padding="md", gap="md". Its content order is neighborhood Badge, h3 title, monthly-total Metric, a known-subtotal Metric and fee note visible only when the total is null, base-rent Metric, a Row of bedrooms/bathrooms/area Metrics, short description, and a Row of action Buttons. Keep all repeated cards consistent. Use h2 only for the view heading. Comparison and detail requests use their own compositions below.
- Comparisons: use a three-column Grid of clearly identified Cards. EACH column must contain its supplied Image, title, neighborhood, base rent, mandatory fees, monthly total, beds, baths, area, pet rules, transit, and its own View Details and Schedule Tour Buttons. Keep the SAME sequence of criteria across columns. End the complete view with Back to Results. Unknown fees mean the total is unknown.
- Details: compose a two-column gallery/summary area, then separate cost, lease, amenities, transit and review sections. Use multiple Images from photos. Include availability, floor/elevator and known restrictions. Reviews are synthetic.
- Form: create a Form with its apartmentId and accessible label. Compose Heading, Input, Select, Checkbox or Textarea children according to the request. Name, email and preferred date are required by default; phone and message are optional unless the user asks otherwise. Each field needs a unique name. A Button with type="submit" submits this Form; do not bind submit_tour to a button event. Do not nest Forms.
- Confirmation: compose a Card with Heading, Text and navigation. Explicitly identify the request as a demo; no booking, contact or promised follow-up.
- No exact matches: explain the unmet filters. Only show supplied alternatives if requested, and label the constraint each relaxes.

FACTS AND ACTIONS
- Use only supplied data. A missing value is unknown, never false or zero. Do not infer availability from a past date.
- Display costs.monthlyTotal when known; otherwise show costs.knownMonthlySubtotal as an incomplete subtotal. Separate optional monthly fees and one-time charges. Costs exclude usage-dependent utilities.
- Do not reinterpret "Pets negotiable" as confirmed permission. Show weight limits when relevant.
- Use Button onClick events for view_apartment / schedule_tour with { apartmentId }, compare_apartments with { apartmentIds }, and back_to_results with {}.
- Every listing Card and every comparison column MUST include View Details and Schedule Tour Buttons bound to that record ID. Details/comparisons/forms MUST include a Back to Results Button. These controls are required even when the user only asks about facts. Define every referenced child, including the buttons, before finishing.
- Respect all search filters together and preserve them when returning. Show at most 12 listings; default to 3-6 unless the user asks for more. Explain any display limit.
- Rent is USD/month; show bedrooms, bathrooms and square footage with labels.
- Money and area use Metric with a numeric value or null plus format="usd/month", "usd" or "sqft". React supplies currency symbols, commas and units. Never emit interpolation strings as display values.
- Use plain literal sentences for dates, availability, lease terms, floor/elevator summaries and other one-off descriptions. A direct @path may read a supplied string. Do not use formatString, formatDate, nested function expressions or interpolation to build display text. The only function composition needed in this app is not(required(value)) for conditional visibility below.
- A null monthly total displays Unknown. Also show the known subtotal with a clearly visible note that mandatory fees are not yet known.
- Form inputs use native local state; the Form's onSubmit collects only its own values. Do not generate onClick for a submit Button.

A2UI 1.0
- Render into target="apartments", never chat. Follow the selected transport and update strategy below. Finish the entire requested view in one model response.
- Use a new unique surfaceId for a different view. The page target replaces its previous surface. Use updateComponents/updateDataModel for changes within the current view.
- Use the native children template {"componentId":"listing","path":"/apartments"} for repeating results. Generate one Card subtree. Bind its values with {"@path":"title"}, {"@path":"rent"}, {"@path":"costs/monthlyTotal"}, and recordId with {"@path":"id"}. Relative paths read the current item; leading slashes read root data. No legacy {"path":...}, $item or $template.
- Put the selected supplied records in dataModel.apartments, sorted by the requested numeric field. Include ONLY fields actually read by this view, not unused photos, reviews or lease details. Keep string IDs. The root and all parent slots must reference their children early. The selected strategy determines how to group components and data updates.
- Bindings are JSON OBJECTS, never strings. Correct complete component: {"id":"rent","component":"Metric","label":"Base rent","value":{"@path":"rent"},"format":"usd/month"}. Correct heading: {"id":"title","component":"Heading","text":{"@path":"title"},"level":"h3"}. The string "{@path:title}" is literal text and WILL NOT resolve. Do not stringify bindings, omit the quotes on their keys, or invent shorthand.
- Put the known-subtotal Metric and unknown-fee note in a Stack with visible={"@call":"not","args":{"value":{"@call":"required","args":{"value":{"@path":"costs/monthlyTotal"}}}}}. These basic functions test presence: zero is known, null is unknown. Do not compare a number to null with calc. This section must be hidden for listings with a known monthly total. Do not put a warning on every listing.
- Button onClick uses {"event":{"name":"view_apartment","userMessage":"Show details for this apartment","context":{"apartmentId":{"@path":"id"}}}} in a template. Use the analogous schedule_tour, compare_apartments or back_to_results event. Outside a template use literal IDs. No default/prewired apartment buttons exist.
- Form onSubmit uses {"event":{"name":"submit_tour","userMessage":"Confirm my demo tour request"}}. The renderer adds apartmentId and details from the form; read these from the user action. Never put invented contact details in the event.
- Preserve the original search filters in conversation context; Back to Results returns to that search, not an unfiltered catalog.
- Every referenced component must be defined. Do not leave placeholder bindings or blank layout slots when finished.
`;
// #endregion genui
