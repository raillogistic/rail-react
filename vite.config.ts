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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (!normalizedId.includes("node_modules")) {
            if (
              normalizedId.includes("/src/widgets/model-table/components/filtering/") ||
              normalizedId.includes("/src/features/model-table/filtering/")
            ) {
              return "table-filtering";
            }
            if (normalizedId.includes("/src/widgets/model-table/compat/")) {
              return "table-compat";
            }
            if (normalizedId.includes("/src/widgets/model-table/components/row/")) {
              return "table-row-actions";
            }
            if (
              normalizedId.includes("/src/widgets/model-table/components/toolbar/") ||
              normalizedId.includes("/src/widgets/model-table/components/TableToolbar.tsx")
            ) {
              return "table-toolbar";
            }
            if (
              normalizedId.includes(
                "/src/widgets/model-table/components/ModelTableOverlays.tsx",
              )
            ) {
              return "table-overlays";
            }
            if (normalizedId.includes("/src/widgets/model-table/hooks/")) {
              return "table-hooks";
            }
            if (normalizedId.includes("/src/widgets/model-table/context/")) {
              return "table-context";
            }
            if (normalizedId.includes("/src/widgets/reporting/")) {
              return "reporting";
            }
            return;
          }

          if (
            normalizedId.includes("/node_modules/react/") ||
            normalizedId.includes("/node_modules/react-dom/") ||
            normalizedId.includes("/node_modules/react-router/") ||
            normalizedId.includes("/node_modules/react-router-dom/")
          ) {
            return "vendor-react";
          }
          if (
            normalizedId.includes("/node_modules/@apollo/client/") ||
            normalizedId.includes("/node_modules/graphql/")
          ) {
            return "vendor-apollo";
          }
          if (
            normalizedId.includes("/node_modules/@tanstack/react-table/") ||
            normalizedId.includes("/node_modules/@tanstack/react-virtual/")
          ) {
            return "vendor-table";
          }
          if (
            normalizedId.includes("/node_modules/recharts/") ||
            normalizedId.includes("/node_modules/d3-")
          ) {
            return "vendor-charts";
          }
          if (
            normalizedId.includes("/node_modules/@radix-ui/") ||
            normalizedId.includes("/node_modules/vaul/")
          ) {
            return "vendor-ui";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [
      "./src/test/setup.ts",
      "./src/features/model-table/filtering/__tests__/setup/setup.ts",
    ],
    css: true,
  },
});
