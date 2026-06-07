import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Vite кладёт module script в <head>; в Telegram WebView defer иногда не срабатывает → #root ещё нет. */
function moveModuleScriptToBody() {
  return {
    name: "move-module-script-to-body",
    enforce: "post" as const,
    transformIndexHtml(html: string) {
      const match = html.match(
        /<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/,
      );
      if (!match) return html;
      const tag = match[0];
      return html
        .replace(tag, "")
        .replace("</body>", `  ${tag}\n</body>`);
    },
  };
}

export default defineConfig({
  envPrefix: ["VITE_", "REACT_APP_"],
  plugins: [react(), moveModuleScriptToBody()],
  build: {
    outDir: "dist",
    target: "es2020",
    rollupOptions: {
      input: "index.html",
    },
  },
});