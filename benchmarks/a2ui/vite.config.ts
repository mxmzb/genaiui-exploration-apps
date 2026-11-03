import react from "../../a2ui-copilotkit/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwind from "../../a2ui-copilotkit/node_modules/@tailwindcss/vite/dist/index.mjs";
import { fileURLToPath } from "node:url";
const app = fileURLToPath(new URL("../../a2ui-copilotkit/", import.meta.url));
export default {
  root: fileURLToPath(new URL("./", import.meta.url)),
  publicDir: fileURLToPath(new URL("../common/public/", import.meta.url)),
  plugins: [tailwind(), react()],
  resolve: {
    alias: {
      react: `${app}node_modules/react`,
      "react-dom": `${app}node_modules/react-dom`,
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
};
