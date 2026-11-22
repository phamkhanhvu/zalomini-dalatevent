import { defineConfig } from "vite";
import ZaloMiniApp from "zmp-vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default () => {
  return defineConfig({
    root: "./src",
    base: "",
    plugins: [tsconfigPaths(), react(), ZaloMiniApp()],
  });
};
