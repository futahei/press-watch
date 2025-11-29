import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

// jsdom が SharedArrayBuffer の growable/resizable を参照するため、Node 環境に簡易 polyfill を注入
if (
  typeof SharedArrayBuffer !== "undefined" &&
  !Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, "growable")
) {
  Object.defineProperty(SharedArrayBuffer.prototype, "growable", {
    get() {
      return false;
    },
  });
}

if (
  typeof ArrayBuffer !== "undefined" &&
  !Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "resizable")
) {
  Object.defineProperty(ArrayBuffer.prototype, "resizable", {
    get() {
      return false;
    },
  });
}

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    globalSetup: ["./vitest.global-setup.ts"],
    pool: "forks",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    poolOptions: {
      threads: {
        execArgv: ["-r", path.resolve(process.cwd(), "./vitest.preload.js")],
      },
      forks: {
        execArgv: ["-r", path.resolve(process.cwd(), "./vitest.preload.js")],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
});
