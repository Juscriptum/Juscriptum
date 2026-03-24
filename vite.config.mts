import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const includesAny = (id: string, needles: string[]) =>
  needles.some((needle) => id.includes(needle));

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
      input: {
        main: path.resolve(__dirname, "index.html"),
        platformAdmin: path.resolve(__dirname, "platform-admin.html"),
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (
            includesAny(id, [
              "/react/",
              "/react-dom/",
              "/scheduler/",
              "/loose-envify/",
              "/js-tokens/",
            ])
          ) {
            return "framework";
          }

          if (
            includesAny(id, [
              "/react-router/",
              "/react-router-dom/",
              "/history/",
              "/@remix-run/",
            ])
          ) {
            return "router";
          }

          if (
            includesAny(id, [
              "/@reduxjs/toolkit/",
              "/react-redux/",
              "/redux/",
              "/immer/",
              "/reselect/",
              "/redux-thunk/",
              "/use-sync-external-store/",
            ])
          ) {
            return "state";
          }

          if (
            includesAny(id, [
              "/react-hook-form/",
              "/@hookform/resolvers/",
              "/zod/",
            ])
          ) {
            return "forms";
          }

          if (includesAny(id, ["/axios/"])) {
            return "http";
          }

          if (
            includesAny(id, ["/@tinymce/tinymce-react/"])
          ) {
            return "tinymce-react";
          }

          if (includesAny(id, ["/tinymce/models/"])) {
            return "tinymce-model";
          }

          if (includesAny(id, ["/tinymce/themes/"])) {
            return "tinymce-theme";
          }

          if (includesAny(id, ["/tinymce/icons/"])) {
            return "tinymce-icons";
          }

          if (includesAny(id, ["/tinymce/skins/"])) {
            return "tinymce-skins";
          }

          if (includesAny(id, ["/tinymce/plugins/"])) {
            return "tinymce-plugins";
          }

          if (includesAny(id, ["/tinymce/"])) {
            return "tinymce-core";
          }

          if (
            includesAny(id, ["/react-pdf/"])
          ) {
            return "pdf-react";
          }

          if (includesAny(id, ["/pdfjs-dist/"])) {
            return "pdf-core";
          }

          if (includesAny(id, ["/pdf-lib/"])) {
            return "pdf-lib";
          }

          if (id.includes("docx-preview")) {
            return "docx-viewer";
          }

          if (id.includes("react-easy-crop") || id.includes("fflate")) {
            return "file-viewer";
          }

          if (id.includes("lucide-react")) {
            return "icons";
          }

          return undefined;
        },
      },
    },
  },
});
