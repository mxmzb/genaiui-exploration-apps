"""Simple FastAPI server for the OpenUI apartment agent."""

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

if hasattr(graph, 'builder'):
    compiled_graph = graph.builder.compile(checkpointer=checkpointer)
else:
    graph.checkpointer = checkpointer
    compiled_graph = graph

agent = LangGraphAGUIAgent(graph=compiled_graph, name="apartment_agent")
add_langgraph_fastapi_endpoint(app, agent)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8123)
