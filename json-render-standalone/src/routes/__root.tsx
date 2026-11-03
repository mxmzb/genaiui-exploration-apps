import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Next Place — Find your next place" },
      {
        name: "description",
        content:
          "An apartment-finder example built with json-render. Tell us what home looks like.",
      },
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
      <body>
        <a className="skip-link" href="#main-content">
          Skip to apartment search
        </a>
        <header className="site-header">
          <Link to="/" className="wordmark" aria-label="Next Place home">
            next place<span aria-hidden="true">.</span>
          </Link>
          <span className="header-note">A good place to start.</span>
          <nav className="view-switch" aria-label="View mode">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "is-active" }}
            >
              Conversation
            </Link>
            <Link to="/surface" activeProps={{ className: "is-active" }}>
              Workspace
            </Link>
          </nav>
        </header>
        <div id="main-content">
          <Outlet />
        </div>
        <footer className="site-footer">
          <span>next place. / A new chapter, somewhere new.</span>
          <span>Sample listings · Tour requests are demonstrations</span>
        </footer>
        <Scripts />
      </body>
    </html>
  );
}
