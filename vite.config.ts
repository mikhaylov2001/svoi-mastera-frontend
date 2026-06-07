import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  envPrefix: ["VITE_", "REACT_APP_"],
  plugins: [react()],
  build: {
    outDir: "dist",
    target: "es2020",
    rollupOptions: {
      input: "index.html"
    }
  }
});