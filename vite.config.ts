import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const base = process.env.GITHUB_PAGES === "true" ? "/fi-engine/" : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: "favicon-base",
      transformIndexHtml(html) {
        return html.replace(
          /(href=")(\.\/)?favicon\.svg(")/,
          `$1${base}favicon.svg$3`
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
