import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/surface")({ server: { handlers: { POST: ({ request }) => Response.redirect(new URL("/api/chat", request.url), 307) } } });
