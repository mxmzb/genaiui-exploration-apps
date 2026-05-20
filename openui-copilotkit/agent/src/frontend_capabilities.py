# Shared manifest describing what the frontend UI runtime can do.
# Referenced by both the orchestrator (main.py) and the UI generator (generate_ui.py).

FRONTEND_CAPABILITIES = """## Frontend UI Runtime Capabilities

The generated UI runs in a client-side runtime that can fetch data, manage state,
and handle user interactions WITHOUT going back through the agent. Use these when
the user wants to explore, filter, or interact — not when they need a specific answer.

### When to use reactive UI (data=None, describe in instruction)
- User wants to **explore**: browse, filter, compare, adjust parameters
- User wants a **dashboard**: stats, metrics, live-updating views
- User wants to **submit something** with instant feedback (forms with loading/success states)

### When to use static UI (pass data, describe layout in instruction)
- User asked a **specific question** that needs a curated answer
- Agent used **reasoning or other tools** to produce the data
- The view is a **fixed display** (detail view, confirmation, single result)

### Available tools (via Query/Mutation in reactive UIs)

| Tool | Type | Description |
|---|---|---|
| `get_neighborhoods` | Query (no args) | Returns distinct neighborhood names for filter dropdowns |
| `get_apartments` | Query | Searches apartments. Args: `neighborhood`, `bedrooms` (exact), `max_rent`. Sentinel values "all"/"any" are ignored. Returns array of objects with fields: `id`, `title`, `neighborhood`, `rent` (number), `bedrooms` (number), `bathrooms` (number), `sqft` (number), `description`, `imageUrl`, `petPolicy`, `availableFrom`, `amenities` (string[]), `nearbyTransit` (string[]). |
| `submit_tour` | Mutation | Submits a tour request. Args: `apartment_id`, `name`, `email`, `date`, `message`. Returns `{success, reference, message}`. |

### Reactive UI primitives

- `$variable` — reactive state. Select/Input components bind to them; Query re-fetches when they change.
- `Query("tool_name", {args}, defaultValue)` — fetches data on render, re-fetches when $variable args change.
- `Mutation("tool_name", {args})` — fires on button click via Action([@Run(ref)]). Exposes .status/.data/.error.
- `@Count(arr)`, `@Avg(arr.field)`, `@Round(num)` (one arg only), `@Filter(arr, field, op, val)`, `@Sort(arr, field, dir)` — client-side data processing. @Round takes ONE argument — no precision parameter.
- `CardGrid([children])` — responsive grid layout for card listings.

### Button action conventions

- "View Details" → `Action([@ToAssistant("action:view:ID")])`
- "Schedule Tour" → `Action([@ToAssistant("action:tour:ID")])`
- "Back to Results" → `Action([@ToAssistant("action:back")])`
- Form submit (static UI) → `Action([@ToAssistant("submit:tour:ID")])`
- Form submit (reactive UI) → `Action([@Run(mutationRef)])`

### Syntax patterns (API reference — not layout prescriptions)

**Populating a Select from Query results:**
```
options = Query("get_neighborhoods", {}, [])
mySelect = Select("label", $myVar, [SelectItem("all", "All"), @Each(options, "item", SelectItem(item, item))])
```

**Iterating over Query data in a CardGrid:**
```
data = Query("get_apartments", {}, [])
grid = CardGrid(@Each(data, "apt", Card([Image(apt.title, apt.imageUrl), CardHeader(apt.title, apt.neighborhood), TextContent("$" + apt.rent + "/mo"), TextContent(apt.bedrooms + " bed • " + apt.sqft + " sqft"), Buttons([Button("View Details", Action([@ToAssistant("action:view:" + apt.id)]), "primary")])])))
```
Use ONE @Each around the entire Card. Inside the Card, access fields directly via `apt.fieldName`.
NEVER define separate statements for card content (like `rentText = @Each(data, "apt", ...)`). ALL card content must be inline inside the single @Each that wraps the Card.

**Dot access for field extraction and aggregation:**
```
data = Query("get_apartments", {}, [])
avgPrice = @Avg(data.rent)
count = @Count(data)
sorted = @Sort(data, "rent", "asc")
```
`data.rent` extracts the `rent` field from every element into a number array. Use this with @Avg, @Sum, @Min, @Max.

**Reactive filters that re-fetch on change:**
```
$filterVar = "default"
results = Query("get_apartments", {neighborhood: $filterVar}, [])
```
When $filterVar changes (e.g. from a Select), the Query re-fetches automatically.

**Mutation with status feedback:**
```
$name = ""
$email = ""
result = Mutation("submit_tour", {name: $name, email: $email})
submitBtn = Button("Submit", Action([@Run(result)]), "primary")
statusText = result.status == "success" ? TextContent(result.data.message) : null
```

**Dynamic button actions with item data:**
```
@Each(data, "item", Button("View", Action([@ToAssistant("action:view:" + item.id)])))
```

### Common mistakes to avoid

- **Do NOT define "helper" statements with @Each and reference them inside another @Each.** OpenUI Lang has no function/macro system. `rentText = @Each(data, "apt", TextContent(apt.rent))` is NOT a reusable template — it evaluates immediately into N elements. Inside a CardGrid @Each, just write the content inline: `TextContent(apt.rent)`.
- **Do NOT pass extra arguments to builtins.** `@Round(num)` takes one arg. `@Avg(arr.field)` takes one arg (an array). `@Count(arr)` takes one arg.
- **Do NOT use assignment expressions inside component args.** `$x = someValue` is a top-level statement, not an inline expression.
- **Do NOT use Slider to drive Query filters.** Slider values are arrays, not scalars. Use Select with predefined options for Query filter controls.
"""
