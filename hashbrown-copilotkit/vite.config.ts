import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  optimizeDeps: {
    exclude: ['@hashbrownai/core'],
  },
  server: {
    fs: {
      allow: ['..', '../..'],
    },
  },
  plugins: [
    nitro({ rollupConfig: { external: [/^@sentry\//, 'better-sqlite3', /^shiki/] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  ssr: {
    noExternal: [
      "@copilotkit/react-core",
      "@copilotkit/shared",
      "@copilotkit/core",
      "@hashbrownai/core",
      "@hashbrownai/react",
    ],
    external: ['better-sqlite3', 'shiki'],
  },
})

export default config
