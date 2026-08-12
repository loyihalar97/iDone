import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@app/shared-types": path.resolve(__dirname, "../../packages/shared-types/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    host: true, // Telegram Mini App tunnel (ngrok/cloudflared) orqali test qilish uchun
  },
});
