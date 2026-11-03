// #region genui - Render a spec and translate its named actions into the next conversation turn.
import {
  ActionProvider,
  Renderer,
  StateProvider,
  VisibilityProvider,
} from "@json-render/react";
import type { Spec } from "@json-render/core";
import { registry } from "../lib/registry";

export function SpecView({
  spec,
  busy,
  send,
}: {
  spec: Spec;
  busy: boolean;
  send: (message: string) => void;
}) {
  const handlers = {
    view_apartment: (p: Record<string, unknown>) =>
      send(`Show me details for apartment ${p.apartmentId}`),
    schedule_tour: (p: Record<string, unknown>) =>
      send(`I'd like to schedule a tour for apartment ${p.apartmentId}`),
    compare_apartments: (p: Record<string, unknown>) =>
      send(
        `Compare apartments ${JSON.stringify(p.apartmentIds)} by monthly cost, pet restrictions, space and transit. Keep every apartment clearly identified.`,
      ),
    back_to_results: () =>
      send(
        "Show me the previous search results again, keeping my original filters.",
      ),
    submit_tour: (p: Record<string, unknown>) => {
      send(
        `Confirm my demo tour request for apartment ${p.apartmentId}. Details: ${JSON.stringify(p.details)}`,
      );
    },
  };
  return (
    <fieldset disabled={busy} className="generated-ui">
      <StateProvider initialState={spec.state}>
        <VisibilityProvider>
          <ActionProvider handlers={handlers}>
            <Renderer spec={spec} registry={registry} loading={busy} />
          </ActionProvider>
        </VisibilityProvider>
      </StateProvider>
    </fieldset>
  );
}
// #endregion genui
