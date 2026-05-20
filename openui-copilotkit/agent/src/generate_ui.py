# #region genui - Generic OpenUI Lang generation tool: domain-agnostic, receives data + instruction
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from langchain.tools import tool
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI

from .frontend_capabilities import FRONTEND_CAPABILITIES

PROMPT_PATH = Path(__file__).parent / "generated" / "system-prompt.txt"


@tool()
def generate_ui(data: dict[str, Any] | None = None, instruction: str = "") -> str:
    """Generate a UI using OpenUI Lang from a natural language instruction.

    Use this tool whenever you need to display structured UI to the user.

    Args:
        data: Optional. Data to embed directly in the UI. Pass None or {}
              when the UI should fetch its own data via Query() — see the
              frontend capabilities for available Query/Mutation tools.
        instruction: What kind of UI to generate. Be specific about layout,
                     which fields to show, and what buttons/actions to include.
    """
    base_prompt = PROMPT_PATH.read_text()

    sections = [base_prompt, FRONTEND_CAPABILITIES]

    if data:
        sections.append(f"## Data\n\n```json\n{json.dumps(data, indent=2)}\n```")
    else:
        sections.append(
            "## Data\n\nNo data provided. Use Query() and Mutation() from the "
            "frontend capabilities to fetch data and handle interactions reactively."
        )

    sections.append(f"## Instruction\n\n{instruction}")

    full_prompt = "\n\n".join(sections)

    model = ChatOpenAI(model="gpt-5.4", temperature=0.3)
    response = model.invoke([SystemMessage(content=full_prompt)])

    content = response.content if isinstance(response.content, str) else str(response.content)
    print(f"[OpenUI] generated {len(content)} chars of OpenUI Lang:")
    print(content)
    return content
# #endregion genui
