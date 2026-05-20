// #region genui - Root layout with nav between Chat and Canvas routes
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "A2UI + CopilotKit — Apartment Finder" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootLayout,
});

function RootLayout() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <header className="border-b border-[var(--line)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto flex items-center gap-3 px-2">
            <span className="text-lg font-bold text-[var(--sea-ink)]">
              A2UI + CopilotKit
            </span>
            <span className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
              Apartment Finder
            </span>
            <nav className="ml-auto flex gap-1 text-sm">
              <Link
                to="/"
                className="nav-link rounded-lg px-3 py-1.5"
                activeProps={{ className: "nav-link is-active rounded-lg px-3 py-1.5" }}
              >
                Chat
              </Link>
              <Link
                to="/canvas"
                className="nav-link rounded-lg px-3 py-1.5"
                activeProps={{ className: "nav-link is-active rounded-lg px-3 py-1.5" }}
              >
                Canvas
              </Link>
            </nav>
          </div>
        </header>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
// #endregion genui
