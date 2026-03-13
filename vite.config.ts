import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/v1"),
      },
      "/storage": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist/frontend",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("react-router-dom")) {
            return "router";
          }

          if (
            id.includes("@reduxjs/toolkit") ||
            id.includes("react-redux") ||
            id.includes("redux")
          ) {
            return "state";
          }

          if (
            id.includes("react/") ||
            id.includes("react-dom/") ||
            id.includes("scheduler")
          ) {
            return "framework";
          }

          if (id.includes("lucide-react")) {
            return "icons";
          }

          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform/resolvers") ||
            id.includes("zod")
          ) {
            return "forms";
          }

          if (id.includes("axios")) {
            return "http";
          }

          if (
            id.includes("tinymce") ||
            id.includes("@tinymce/tinymce-react")
          ) {
            return "tinymce";
          }

          if (id.includes("react-pdf") || id.includes("pdfjs-dist")) {
            return "pdf-viewer";
          }

          if (id.includes("docx-preview")) {
            return "docx-viewer";
          }

          if (id.includes("react-easy-crop") || id.includes("fflate")) {
            return "file-viewer";
          }

          return "vendor";
        },
      },
    },
  },
});
