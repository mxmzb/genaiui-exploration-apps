# #region genui - json-render JSONL generation tool: domain-agnostic, receives data + instruction
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from langchain.tools import tool
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI

PROMPT_PATH = Path(__file__).parent / "generated" / "system-prompt.txt"


@tool()
def generate_ui(data: dict[str, Any] | None = None, instruction: str = "") -> str:
    """Generate a UI using json-render JSONL format from a natural language instruction.

    Use this tool whenever you need to display structured UI to the user.

    Args:
        data: Optional. Apartment data to embed directly in the UI as literal
              prop values. Pass None or {} when no data is needed (e.g. for
              confirmations or simple messages).
        instruction: What kind of UI to generate. Be specific about layout,
                     which components to use, what buttons/actions to include,
                     and how to format values (rent as "$X,XXX/mo", sqft as
                     "X,XXX sqft").
    """
    base_prompt = PROMPT_PATH.read_text()

    sections = [base_prompt]

    if data:
        sections.append(f"## Data\n\n```json\n{json.dumps(data, indent=2)}\n```")
    else:
        sections.append(
            "## Data\n\nNo data provided. Generate UI based on the instruction only."
        )

    sections.append(f"## Instruction\n\n{instruction}")

    full_prompt = "\n\n".join(sections)

    model = ChatOpenAI(model="gpt-4.1", temperature=0.3)
    response = model.invoke([SystemMessage(content=full_prompt)])

    content = response.content if isinstance(response.content, str) else str(response.content)
    print(f"[json-render] generated {len(content)} chars of JSONL:")
    print(content)
    return content
# #endregion genui
