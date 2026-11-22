import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Website tĩnh: kết quả build nằm trong dist/, đường dẫn tương đối nên đặt ở thư mục nào trên máy chủ cũng chạy,
// và dùng luôn làm phần giao diện cho app iOS (xem ../ios-app).
export default defineConfig({
  base: "",
  plugins: [react({ jsxRuntime: "classic" })],
  build: { outDir: "dist", emptyOutDir: true },
});
