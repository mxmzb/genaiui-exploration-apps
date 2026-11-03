"""Local scripted model for UI checks. No LLM calls; never use for model benchmarks."""
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from fixture_views import interface


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        messages = body.get("messages", [])
        user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        latest = messages[-1] if messages else {}
        tools = body.get("tools", [])
        message = {"role": "assistant", "content": None}
        if tools:
            # Exercise the real CopilotKit -> LangGraph -> tool-result path.
            turn = messages[messages.index(next(m for m in reversed(messages) if m["role"] == "user")):]
            used = [call["function"]["name"] for m in turn for call in m.get("tool_calls", [])]
            if "generate_ui" in used:
                message["content"] = "Controlled preview: scripted output, no model call."
            else:
                name = "get_apartments" if "get_apartments" not in used else "generate_ui"
                args = {} if name == "get_apartments" else {"data": {}, "instruction": user}
                message["tool_calls"] = [{"id": "fixture-" + str(time.time_ns()), "type": "function", "function": {"name": name, "arguments": json.dumps(args)}}]
        else:
            prompt = user or str(latest.get("content", "")).split("## Instruction")[-1]
            message["content"] = "Controlled preview: scripted output, no model call.\n" + interface(prompt)
            if "malformed patch" in prompt.lower():
                message["content"] += '\n{"op":"add","path":"/elements/broken","value":'
        finish = "tool_calls" if "tool_calls" in message else "stop"
        payload = {"id": "fixture", "object": "chat.completion", "created": 0, "model": "fixture", "choices": [{"index": 0, "message": message, "finish_reason": finish}], "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}}
        self.send_response(200)
        if body.get("stream"):
            self.send_header("Content-Type", "text/event-stream")
            self.end_headers()
            delta = dict(message)
            if "tool_calls" in delta:
                delta["tool_calls"] = [{"index": i, **call} for i, call in enumerate(delta["tool_calls"])]
            chunks = [delta] if message.get("content") is None else [{"role": "assistant", "content": line + "\n"} for line in message["content"].splitlines()]
            try:
                for chunk in chunks:
                    event = {"id": "fixture", "object": "chat.completion.chunk", "created": 0, "model": "fixture", "choices": [{"index": 0, "delta": chunk, "finish_reason": None}]}
                    self.wfile.write(("data: " + json.dumps(event) + "\n\n").encode())
                    self.wfile.flush()
                    time.sleep(0.04)
                self.wfile.write(('data: {"id":"fixture","choices":[{"index":0,"delta":{},"finish_reason":"' + finish + '"}]}\n\ndata: [DONE]\n\n').encode())
            except (BrokenPipeError, ConnectionResetError):
                pass
        else:
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(payload).encode())


print("Scripted UI fixture provider: http://127.0.0.1:9012/v1", flush=True)
ThreadingHTTPServer(("127.0.0.1", 9012), Handler).serve_forever()
