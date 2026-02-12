import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Force a single React instance across workspace-level dependencies
    // (e.g. @tiptap/react resolved from a parent node_modules).
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [
      "./src/test/setup.ts",
      "./src/lib/filters/__tests__/setup/setup.ts",
    ],
    css: true,
  },
});
