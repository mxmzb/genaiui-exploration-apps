import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // Allow Vite's dev server to serve files from the shared db/ folder
  // (one level above the app's package root) so apartment-data.ts can import
  // ../../../db/query.
  server: {
    fs: {
      allow: ["..", "../.."],
    },
  },
  ssr: {
    // better-sqlite3 is a native Node module; never bundle it for SSR.
    external: ["better-sqlite3"],
  },
  plugins: [
    nitro({ rollupConfig: { external: [/^@sentry\//, "better-sqlite3"] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
