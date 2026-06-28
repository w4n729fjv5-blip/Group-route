import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // Relative asset paths so the built app works at any URL/subfolder, not just
  // the domain root. Makes the dist/ folder drop-in hostable anywhere.
  base: "./",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
