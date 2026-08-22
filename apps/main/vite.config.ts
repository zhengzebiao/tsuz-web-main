import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    testTimeout: 15_000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  server: {
    port: 7200,
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://test-api.tusz.online",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@tsuz/api": fileURLToPath(new URL("../../packages/api/src/index.ts", import.meta.url)),
      "@tsuz/shared": fileURLToPath(new URL("../../packages/shared/src/index.ts", import.meta.url)),
      "@tsuz/ui": fileURLToPath(new URL("../../packages/ui/src/index.tsx", import.meta.url))
    },
    dedupe: ["react", "react-dom"]
  }
});
