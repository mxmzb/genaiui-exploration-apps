import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom", "@openuidev/react-lang", "@openuidev/lang-core"] },
  // Allow Vite's dev server to serve files from the shared db/ folder
  // (one level above the app's package root) so apartment-data.ts can import
  // ../../../db/query.
  server: {
    fs: {
      allow: ["..", "../.."],
    },
  },
  ssr: {
    noExternal: [
      "@copilotkit/react-core",
      "@copilotkit/shared",
      "@copilotkit/core",
    ],
    // better-sqlite3 is a native Node module; never bundle it for SSR.
    external: ["better-sqlite3", "shiki"],
  },
  plugins: [
    nitro({
      rollupConfig: { external: [/^@sentry\//, "better-sqlite3", /^shiki/] },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
