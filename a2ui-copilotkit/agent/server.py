"""Simple FastAPI server — no LangSmith, no LangGraph Platform, just a local HTTP agent."""

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from langgraph.checkpoint.memory import MemorySaver
from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from copilotkit.langgraph_agui_agent import LangGraphAGUIAgent

load_dotenv("../.env")

from main import graph  # noqa: E402

app = FastAPI()

checkpointer = MemorySaver()

# create_agent returns a compiled graph — but without a checkpointer.
# Re-create it from the builder with our checkpointer.
if hasattr(graph, 'builder'):
    compiled_graph = graph.builder.compile(checkpointer=checkpointer)
else:
    # Fallback: inject checkpointer directly
    graph.checkpointer = checkpointer
    compiled_graph = graph

agent = LangGraphAGUIAgent(graph=compiled_graph, name="apartment_agent")
add_langgraph_fastapi_endpoint(app, agent)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8123)
