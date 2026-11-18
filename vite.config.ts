import { defineConfig } from "vite";
// @ts-expect-error thiếu @types/node
import process from "node:process";
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(() => ({
  // mỗi loại cửa sổ một trang: overlay chụp và cài đặt phím tắt
  build: {
    rollupOptions: { input: { overlay: "index.html", settings: "settings.html" } },
  },

  // tuỳ chọn Vite cho Tauri, chỉ dùng khi `tauri dev` / `tauri build`
  //
  // 1. không để Vite che lỗi Rust
  clearScreen: false,
  // 2. Tauri cần cổng cố định, bận thì báo lỗi
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. Vite không theo dõi `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
