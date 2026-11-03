import { useEffect, useState, type ReactNode } from "react";
import {
  CopilotKitProvider,
  useAgent,
  useCopilotKit,
} from "@copilotkit/react-core/v2";
import {
  GenerativeUISurface,
  MarkdownSurfaces,
} from "@copilotkit/react-core/v2/generative-ui";
import { apartmentUI } from "../lib/catalog";
import { GenerationRunning } from "../lib/generation-state";
import { Composer, Loading, Welcome, requestLabel } from "./FinderUI";
import {
  defaultVariant,
  generations,
  generationLabels,
  generationDescriptions,
  variantId,
  type Variant,
} from "../lib/variants";

// CopilotKit owns the A2UI stream, data bindings, surface updates and user events.
export function ApartmentFinder({
  initialVariant = defaultVariant,
  runtimeUrl = "/api/copilotkit",
  children,
}: {
  initialVariant?: Variant;
  runtimeUrl?: string;
  children?: ReactNode;
}) {
  const [session, setSession] = useState(0);
  const [variant, setVariant] = useState(initialVariant);
  function changeVariant(next: Variant) {
    setVariant(next);
    const url = new URL(window.location.href);
    url.searchParams.set("transport", next.transport);
    url.searchParams.set("generation", next.generation);
    window.history.replaceState(null, "", url);
  }
  return (
    <CopilotKitProvider
      key={`${variantId(variant)}-${session}`}
      agentId={variantId(variant)}
      runtimeUrl={runtimeUrl}
      useSingleEndpoint={false}
      enableInspector={false}
      generativeUI={{ ui: apartmentUI, transport: variant.transport }}
    >
      <Workspace
        reset={() => setSession((value) => value + 1)}
        variant={variant}
        changeVariant={changeVariant}
      />
      {children}
    </CopilotKitProvider>
  );
}

function Workspace({
  reset,
  variant,
  changeVariant,
}: {
  reset: () => void;
  variant: Variant;
  changeVariant: (variant: Variant) => void;
}) {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();
  const [error, setError] = useState("");
  useEffect(() => {
    const subscription = agent.subscribe({
      onRunInitialized: () => {
        setError("");
      },
      onRunErrorEvent: ({ event }) => {
        setError(event.message);
      },
      onRunFailed: ({ error }) => {
        setError(error.message);
      },
    });
    return () => subscription.unsubscribe();
  }, [agent]);
  const lastUser = agent.messages.findLast(
    (message) => message.role === "user",
  );
  const hasMessages = !!lastUser;
  const lastAssistant = agent.messages.findLast(
    (message) =>
      message.role === "assistant" &&
      typeof message.content === "string" &&
      message.content,
  );

  async function send(text: string) {
    if (agent.isRunning) return;
    setError("");
    agent.addMessage({ id: crypto.randomUUID(), role: "user", content: text });
    try {
      await copilotkit.runAgent({ agent });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Please try your search again.",
      );
    }
  }

  return (
    <GenerationRunning value={agent.isRunning}>
      <main className={`finder ${hasMessages ? "has-messages" : ""}`}>
        <fieldset className="variant-controls" disabled={agent.isRunning}>
          <legend className="eyebrow">Explore A2UI</legend>
          <label>
            Transport
            <select
              aria-label="Transport"
              value={variant.transport}
              onChange={(e) =>
                changeVariant({
                  ...variant,
                  transport: e.target.value as Variant["transport"],
                })
              }
            >
              <option value="tool">Tool calls</option>
              <option value="markdown">Markdown</option>
            </select>
          </label>
          <label>
            Generation
            <select
              aria-label="Generation"
              value={variant.generation}
              onChange={(e) =>
                changeVariant({
                  ...variant,
                  generation: e.target.value as Variant["generation"],
                })
              }
            >
              {generations.map((value) => (
                <option key={value} value={value}>
                  {generationLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <p>
            {generationDescriptions[variant.generation]}
            <small>
              Changing a variant starts a new search. Actions unlock when
              generation finishes.
            </small>
          </p>
        </fieldset>
        <Composer send={send} busy={agent.isRunning} />
        {lastUser && (
          <div className="results-toolbar">
            <div>
              <p className="eyebrow">Your apartment search</p>
              <p className="search-summary">
                {requestLabel(
                  typeof lastUser.content === "string"
                    ? lastUser.content.split("\n")[0]
                    : "Your next place",
                )}
              </p>
            </div>
            <button
              className="text-button"
              onClick={reset}
              disabled={agent.isRunning}
            >
              ↺ Start fresh
            </button>
          </div>
        )}
        <div className="finder-content">
          <fieldset
            className="surface-controls generated-ui"
            disabled={agent.isRunning}
            aria-label="Apartment results"
            aria-busy={agent.isRunning}
          >
            <GenerativeUISurface
              id="apartments"
              ui={apartmentUI}
              autoScroll={false}
              description="The main apartment workspace. Render all search results, comparisons, details, demo tour forms and confirmations here. Replace this workspace for each request; do not create chat surfaces."
              fallback={
                !hasMessages ? (
                  <Welcome send={send} busy={agent.isRunning} />
                ) : undefined
              }
            />
          </fieldset>
          {!agent.isRunning &&
            lastAssistant &&
            (variant.transport === "markdown" ? (
              <MarkdownSurfaces
                content={String(lastAssistant.content)}
                messageId={lastAssistant.id}
              />
            ) : (
              <p className="assistant-text">{String(lastAssistant.content)}</p>
            ))}
          {agent.isRunning && <Loading />}
          {error && (
            <div className="error-notice" role="alert">
              <strong>We couldn’t finish that search.</strong>
              <p>{error}</p>
              <button
                className="text-button"
                onClick={() => {
                  if (typeof lastUser?.content === "string")
                    void send(lastUser.content);
                }}
              >
                Try again ↗
              </button>
            </div>
          )}
        </div>
      </main>
    </GenerationRunning>
  );
}
