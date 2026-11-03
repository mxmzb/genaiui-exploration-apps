import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { OpenUIDevtools } from "@openuidev/devtools";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Next Place — OpenUI apartment finder" },
      {
        name: "description",
        content:
          "An apartment-finder example built with OpenUI and CopilotKit. Tell us what home looks like.",
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
          <span className="header-framework">OpenUI · City guide</span>
        </header>
        <div id="main-content">
          <Outlet />
        </div>
        <footer className="site-footer">
          <span>next place. / A new chapter, somewhere new.</span>
          <span>Sample listings · Tour requests are demonstrations</span>
        </footer>
        {import.meta.env.DEV && <OpenUIDevtools version="0.3.1" autoOpenOnError={false} position="bottom-left" />}
        <Scripts />
      </body>
    </html>
  );
}
