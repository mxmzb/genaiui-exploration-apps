import { defineConfig } from "../../json-render-standalone/node_modules/vite/dist/node/index.js";
import react from "../../json-render-standalone/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwind from "../../json-render-standalone/node_modules/@tailwindcss/vite/dist/index.mjs";
import { fileURLToPath } from "node:url";

const app = fileURLToPath(new URL("../../json-render-standalone/", import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  plugins: [tailwind(), react()],
  resolve: {
    alias: { react: `${app}node_modules/react`, "react-dom": `${app}node_modules/react-dom` },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
