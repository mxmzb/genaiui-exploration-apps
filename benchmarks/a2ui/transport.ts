import { setTimeout as delay } from "node:timers/promises";
import { readFile, writeFile, rename } from "node:fs/promises";
import { reserveCost } from "../json-render/budget.ts";
import { fixture } from "./fixtures.ts";

// Persist reservations BEFORE sending. An interrupted/unknown charge keeps its full
// reservation across restarts; changing --max-spend-usd does not reset spending.
export class Ledger {
  entries: any[] = [];
  constructor(
    public path: string,
    public maximum: number,
  ) {
    if (!(maximum > 0 && maximum <= 30))
      throw Error("This campaign requires a cap in (0, $30]");
  }
  async load() {
    try {
      this.entries = JSON.parse(await readFile(this.path, "utf8"));
    } catch (e: any) {
      if (e.code !== "ENOENT") throw e;
    }
  }
  get used() {
    return this.entries.reduce((n, e) => n + (e.actual ?? e.reserved), 0);
  }
  async save() {
    await writeFile(this.path + ".tmp", JSON.stringify(this.entries, null, 2));
    await rename(this.path + ".tmp", this.path);
  }
  async reserve(id: string, amount: number) {
    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      this.used + amount > this.maximum
    )
      throw Error("Campaign spend cap reached; request not sent");
    if (this.entries.some((e) => e.id === id))
      throw Error("Duplicate paid request");
    this.entries.push({ id, reserved: amount, actual: null });
    await this.save();
  }
  async settle(id: string, actual: unknown) {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) throw Error("Missing reservation");
    if (typeof actual === "number" && Number.isFinite(actual) && actual >= 0)
      entry.actual = actual;
    await this.save();
    if (this.used > this.maximum)
      throw Error("Reported charge exceeded reservation; stop");
  }
}

export function providerTransport(
  trial: any,
  live: boolean,
  model: any,
  ledger?: Ledger,
): typeof fetch {
  return async (url, init: any) => {
    if (trial.request)
      throw Error("More than one provider request is forbidden in this pilot");
    const body = JSON.parse(init.body);
    if (trial.framework !== "json-render" && (
      body.model !== model.id ||
      body.provider?.only?.[0] !== model.providerTag ||
      body.provider.allow_fallbacks !== false ||
      !body.provider.zdr
    ))
      throw Error("Pinned model/provider routing was lost");
    trial.request = body; // Request body only: never persist authentication headers.
    if (live) {
      trial.reservedUsd = reserveCost(
        Buffer.byteLength(init.body),
        16000,
        model.pricing,
      );
      await ledger!.reserve(trial.id, trial.reservedUsd);
    }
    const start = performance.now();
    let response: Response;
    if (live)
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.any([
          init.signal ?? new AbortController().signal,
          AbortSignal.timeout(120000),
        ]),
      });
    else {
      const raw = trial.replayRaw ?? fixture(trial.task, trial.variant, trial.control).raw;
      response = new Response(
        new ReadableStream({
          async start(controller) {
            const send = (value: any) =>
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(value)}\n\n`),
              );
            const event = (
              delta: any,
              finish_reason: any = null,
              usage?: any,
            ) => ({
              id: "replay",
              model: model.id,
              provider: "replay",
              choices: [{ index: 0, delta, finish_reason }],
              ...(usage ? { usage } : {}),
            });
            if (trial.variant.transport === "tool")
              send(
                event({
                  role: "assistant",
                  tool_calls: [
                    {
                      index: 0,
                      id: "replay-ui",
                      type: "function",
                      function: { name: "render_ui", arguments: "" },
                    },
                  ],
                }),
              );
            for (let i = 0; i < raw.length; i += 96) {
              await delay(8);
              const chunk = raw.slice(i, i + 96);
              send(
                event(
                  trial.variant.transport === "tool"
                    ? {
                        tool_calls: [
                          { index: 0, function: { arguments: chunk } },
                        ],
                      }
                    : { content: chunk },
                ),
              );
            }
            await delay(250);
            send(
              event(
                {},
                trial.variant.transport === "tool" ? "tool_calls" : "stop",
                {
                  prompt_tokens: 0,
                  completion_tokens: 0,
                  total_tokens: 0,
                  cost: 0,
                },
              ),
            );
            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            controller.close();
          },
        }),
        { headers: { "content-type": "text/event-stream" } },
      );
    }
    trial.httpStatus = response.status;
    trial.capture = (async () => {
      trial.raw = "";
      trial.events = [];
      trial.calls = {};
      if (!response.ok) {
        trial.providerError = await response.clone().text();
        return;
      }
      const reader = response.clone().body!.getReader(),
        decoder = new TextDecoder();
      let pending = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const lines = pending.split("\n");
        pending = lines.pop()!;
        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          const event = JSON.parse(line.slice(6));
          trial.events.push({ ms: performance.now() - start, event });
          if (event.usage) trial.usage = event.usage;
          if (event.provider) trial.servingProvider = event.provider;
          if (event.model) trial.returnedModel = event.model;
          if (event.id) trial.generationId = event.id;
          if (event.error) trial.providerError = event.error;
          const choice = event.choices?.[0];
          if (choice?.finish_reason) trial.finishReason = choice.finish_reason;
          if (choice?.delta?.content) {
            trial.firstTokenMs ??= performance.now() - start;
            trial.raw += choice.delta.content;
          }
          for (const call of choice?.delta?.tool_calls ?? []) {
            const state = (trial.calls[call.index] ??= {
              name: "",
              arguments: "",
            });
            state.name += call.function?.name ?? "";
            state.arguments += call.function?.arguments ?? "";
            if (call.function?.arguments)
              trial.firstTokenMs ??= performance.now() - start;
          }
        }
      }
      if (trial.variant.transport === "tool")
        trial.raw = Object.values(trial.calls)
          .map((c: any) => c.arguments)
          .join("");
      trial.providerFinishedMs = performance.now() - start;
    })().catch((e) => {
      trial.captureError = String(e);
    });
    return response;
  };
}
