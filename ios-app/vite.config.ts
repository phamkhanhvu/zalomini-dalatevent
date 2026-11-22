import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Dùng chung mã nguồn ở ../src với Zalo Mini App.
// Hai thư viện của Zalo được thay bằng bản tương đương cho app iOS (thư mục src/shims).
export default defineConfig({
  root: here,
  base: "",
  plugins: [react({ jsxRuntime: "classic" })],
  define: {
    "import.meta.env.VITE_TARGET": JSON.stringify("native"),
  },
  resolve: {
    alias: [
      { find: /^zmp-ui$/, replacement: path.join(here, "src/shims/zmp-ui.tsx") },
      { find: /^zmp-sdk$/, replacement: path.join(here, "src/shims/zmp-sdk.ts") },
      { find: "@shared", replacement: path.join(here, "../src") },
    ],
    dedupe: ["react", "react-dom", "react-router"],
  },
  server: { fs: { allow: [path.join(here, "..")] } },
  build: { outDir: "dist", emptyOutDir: true },
});
