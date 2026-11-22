import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

const isProductionWorker = process.env.DEPLOY_TARGET === "production";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  plugins: [
    cloudflare({
      configPath: isProductionWorker
        ? "./wrangler.production.jsonc"
        : "./wrangler.staging.jsonc",
      viteEnvironment: { name: "ssr" },
    }),
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
  ],
});
