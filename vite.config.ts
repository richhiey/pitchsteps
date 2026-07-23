import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // AudioWorklet.addModule() needs a real same-origin module URL. Prevent Vite
  // from inlining the small worklet as an unsupported data: URL.
  build: {
    assetsInlineLimit: 0
  },
  worker: {
    format: "es"
  }
});
