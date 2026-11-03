// Normalize only what actually arrived at the server. Expectations never enter here.
export function actionRequest(body: any, framework: string) {
  const message = body.messages?.findLast((m: any) => m.role === "user");
  const text = message?.content ?? "";
  let envelope: any;
  function find(value: any) {
    if (!value || typeof value !== "object") return;
    if (value.copilotkit_action) envelope = value.copilotkit_action.action;
    else for (const child of Object.values(value)) find(child);
  }
  find(body.forwardedProps);
  let action: any;
  if (envelope) action = { name: envelope.name, ...envelope.context };
  else if (framework === "json-render") {
    let match;
    if ((match = text.match(/^Show me details for apartment (\S+)$/))) action = { name: "view_apartment", apartmentId: match[1] };
    else if ((match = text.match(/^I'd like to schedule a tour for apartment (\S+)$/))) action = { name: "schedule_tour", apartmentId: match[1] };
    else if (text === "Show me the previous search results again, keeping my original filters.") action = { name: "back_to_results" };
    else if ((match = text.match(/^Confirm my demo tour request for apartment (\S+)\. Details: ([\s\S]+)$/))) {
      try { action = { name: "submit_tour", apartmentId: match[1], details: JSON.parse(match[2]) }; } catch {}
    }
  } else {
    try { const parsed = JSON.parse(text.slice(text.indexOf("\n") + 1)); action = { ...parsed, name: parsed.name ?? parsed.action }; delete action.action; } catch {}
  }
  return { message, envelope, action: action ?? null, runId: body.runId, threadId: body.threadId };
}
