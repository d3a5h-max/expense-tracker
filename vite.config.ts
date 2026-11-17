import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tauri from "vite-plugin-tauri";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tauri()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  clearScreen: false,
});