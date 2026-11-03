import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { fixture } from "./fixtures.ts";

// This hook only configures the route and observes transport; generation remains in the app.
export function transport(trial: any, model: any, control?: string) {
  return async (url: any, init: any) => {
    const body = JSON.parse(init.body);
    if (body.model !== model.id) throw new Error("Requested model did not reach the SDK");
    body.provider = { only: [model.providerTag], allow_fallbacks: false, require_parameters: true };
    if (model.zdr) body.provider.zdr = true;
    body.plugins = [];
    if (model.temperature === null) delete body.temperature;
    if (model.maxCompletionParameter) { body.max_completion_tokens = body.max_tokens; delete body.max_tokens; }
    if (model.reasoning) body.reasoning = model.reasoning;
    trial.request = body; // No credentials/headers are persisted.
    trial.callStarted = performance.now();
    let response: Response;
    if (control) {
      const lines = fixture(trial.task, control);
      response = new Response(new ReadableStream({
        async start(controller) {
          const send = (data: any) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
          for (const line of lines) {
            await delay(line.includes('"path":"/state/apartments/') ? 250 : 8);
            send({ id: "fixture", model: model.id, choices: [{ index: 0, delta: { content: line + "\n" }, finish_reason: null }] });
          }
          await delay(650);
          send({ id: "fixture", model: model.id, provider: "fixture", choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 } });
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }), { headers: { "content-type": "text/event-stream" } });
    } else response = await fetch(url, { ...init, body: JSON.stringify(body) });
    trial.httpStatus = response.status;
    if (!response.ok) {
      trial.providerError = await response.clone().json().catch(() => ({ error: { message: `HTTP ${response.status}` } }));
      trial.capture = Promise.resolve();
      return response;
    }
    trial.capture = (async () => {
      const reader = response.clone().body!.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      trial.raw = "";
      trial.providerEvents = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const lines = pending.split("\n"); pending = lines.pop()!;
        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          const event = JSON.parse(line.slice(6));
          trial.providerEvents.push(event);
          if (event.id) trial.generationId = event.id;
          if (event.model) trial.returnedModel = event.model;
          if (event.provider) trial.servingProvider = event.provider;
          if (event.usage) trial.usage = event.usage;
          const choice = event.choices?.[0];
          if (choice?.finish_reason) trial.finishReason = choice.finish_reason;
          if (choice?.delta?.content) {
            trial.firstTokenMs ??= performance.now() - trial.callStarted;
            trial.raw += choice.delta.content;
          }
          if (event.error) trial.providerError = event.error;
        }
      }
      trial.providerFinishedMs = performance.now() - trial.callStarted;
    })().catch((error) => { trial.captureError = String(error); });
    return response;
  };
}
