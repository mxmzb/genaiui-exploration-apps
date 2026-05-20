import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // Allow Vite's dev server to serve files from the shared db/ folder
  // (one level above the app's package root) so apartment-data.ts can import
  // ../db/query.
  server: {
    fs: {
      allow: ['..'],
    },
  },
  plugins: [
    devtools(),
    nitro({
      rollupConfig: { external: [/^@sentry\//, 'better-sqlite3'] },
      // CopilotKit v2 internally imports CSS which Node.js can't handle during SSR.
      // Tell Nitro to bundle these packages so Rollup processes the CSS imports.
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  ssr: {
    // Ensure CopilotKit packages are processed by Vite during SSR
    // instead of being loaded raw by Node.js (which chokes on .css imports)
    noExternal: [
      "@copilotkit/react-core",
      "@copilotkit/a2ui-renderer",
      "@copilotkit/shared",
      "@copilotkit/core",
    ],
    // better-sqlite3 is a native Node module; never bundle it for SSR.
    external: ['better-sqlite3'],
  },
})

export default config
