# #region genui - Generic A2UI generation matching CopilotKit showcase pattern
from __future__ import annotations

import json
from typing import Any, cast

from langchain.tools import tool, ToolRuntime
from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.tools import tool as lc_tool
from langchain_openai import ChatOpenAI

from copilotkit import a2ui  # pyright: ignore[reportAttributeAccessIssue]

CATALOG_ID = "apartment-finder-catalog"

PROGRESSIVE_OVERRIDE = """\
PROGRESSIVE STREAMING DISCIPLINE (overrides the default template guidance):

For repeating content (search results, listings, lists of similar items) with up
to ~10 entries, emit each item as SEPARATE top-level components with all values
as INLINE LITERALS. Do NOT use the template pattern (`children: { componentId,
path }`) and do NOT use a data model. The schema's narrowed string types apply
to template props as well — paths are not allowed even for per-item access.

WHY: the middleware streams component-by-component. Templates with path-bound
values wait for the entire data object to complete before any card shows
content, producing a flash where all items appear at once. Separate components
with inline values stream and become visible one by one.

For card lists, use CardGrid (NOT Row). CardGrid is a responsive grid that
adapts to screen size automatically. Tune density via minColumnWidth (smaller
= more columns) and maxColumns (cap on wide screens).

ApartmentCard is slot-based — it composes by referencing other components by
ID. The card REQUIRES an apartmentId prop and renders standard "View Details"
and "Schedule Tour" action buttons automatically (do NOT emit Button
components for these actions — the renderer handles them and binds them to
apartmentId). Each card otherwise requires several top-level components (one
per slot). Example for two apartments:

  components: [
    { id: "root", component: "Column", children: ["title", "grid"] },
    { id: "title", component: "Title", text: "Available Apartments", level: "h1" },

    { id: "grid", component: "CardGrid",
      minColumnWidth: 280, gap: 16, maxColumns: 4,
      children: ["card-1", "card-2"] },

    { id: "card-1", component: "ApartmentCard", apartmentId: "1",
      imageId: "card-1-img", titleId: "card-1-title", subtitleId: "card-1-sub",
      priceRowId: "card-1-meta", descriptionId: "card-1-desc" },
    { id: "card-1-img", component: "Image", url: "https://..." },
    { id: "card-1-title", component: "Text", text: "Sunset Loft" },
    { id: "card-1-sub", component: "Text", text: "Arts District" },
    { id: "card-1-meta", component: "Row", children: ["card-1-rent", "card-1-specs"] },
    { id: "card-1-rent", component: "Text", text: "$2,200/mo" },
    { id: "card-1-specs", component: "Text", text: "1BR · 1BA · 850 sqft" },
    { id: "card-1-desc", component: "TextBlock", text: "Open-concept loft..." },

    { id: "card-2", component: "ApartmentCard", apartmentId: "2",
      imageId: "card-2-img", ... },
    { id: "card-2-img", component: "Image", url: "..." },
    ... (repeat for each card)
  ]

  data: omitted entirely.

Templates remain appropriate only for very large lists (>20 items) and forms
(where path bindings are required for two-way binding).
"""


@lc_tool
def render_a2ui(
    surfaceId: str,
    catalogId: str,
    components: list[dict],
    data: dict | None = None,
) -> str:
    """Render a dynamic A2UI v0.9 surface.

    Args:
        surfaceId: Unique surface identifier.
        catalogId: The catalog ID (use "apartment-finder-catalog").
        components: A2UI v0.9 component array (flat format). The root
            component must have id "root".
        data: Optional initial data model for the surface.
    """
    _ = surfaceId, catalogId, components, data
    return "rendered"


@tool()
def generate_a2ui(runtime: ToolRuntime[Any], instruction: str) -> str:
    """Generate dynamic A2UI components based on the conversation and an
    explicit view instruction.

    A secondary LLM designs the UI schema and data. The instruction tells the
    secondary LLM which kind of view to produce. The result is returned as
    a2ui_operations for the A2UI middleware to detect and render.

    Args:
        instruction: Natural-language description of the view to render.
            Examples:
              "List all apartments as cards in a responsive CardGrid."
              "Detail view of apartment 3: full description, amenities,
                  nearby transit. Use DetailSection for each block."
              "Tour scheduling form for apartment 3: name and email TextField,
                  DateTimeInput for tour time, submit Button."
              "Confirmation message that the tour for apartment 3 at <time>
                  has been booked."
    """
    messages = runtime.state["messages"][:-1]

    context_entries = runtime.state.get("copilotkit", {}).get("context", [])
    context_text = "\n\n".join(
        entry.get("value", "")
        for entry in context_entries
        if isinstance(entry, dict) and entry.get("value")
    )

    print(f"[A2UI] generate_a2ui called, instruction={instruction!r}")
    print(f"[A2UI] last 3 messages:")
    for m in messages[-3:]:
        msg_type = type(m).__name__
        content = str(getattr(m, "content", "<no content>"))[:200]
        print(f"  [{msg_type}] {content}")

    model = ChatOpenAI(model="gpt-4.1")
    model_with_tool = model.bind_tools(
        [render_a2ui],
        tool_choice="render_a2ui",
    )

    response = cast(
        AIMessage,
        model_with_tool.invoke(
            [
                SystemMessage(content=context_text),
                SystemMessage(content=PROGRESSIVE_OVERRIDE),
                SystemMessage(content=f"VIEW INSTRUCTION (what to render this turn): {instruction}"),
                *messages,
            ],
        ),
    )

    if not response.tool_calls:
        return json.dumps({"error": "LLM did not call render_a2ui"})

    args = response.tool_calls[0]["args"]

    surface_id = args.get("surfaceId", "apartment-results")
    catalog_id = args.get("catalogId", CATALOG_ID)
    components = args.get("components", [])
    data = args.get("data", {})

    print(f"[A2UI] generated {len(components)} components, surfaceId={surface_id}, data_keys={list(data.keys()) if data else []}")

    ops = [
        a2ui.create_surface(surface_id, catalog_id=catalog_id),
        a2ui.update_components(surface_id, components),
    ]
    if data:
        ops.append(a2ui.update_data_model(surface_id, data))

    return a2ui.render(operations=ops)
# #endregion genui
