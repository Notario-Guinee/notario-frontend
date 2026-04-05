import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode: _mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      port: 8080,
      overlay: false,
    },
    proxy: {
      "/api-admin": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-admin/, "/api"),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            proxyReq.removeHeader("origin");
            if (!proxyReq.getHeader("X-Tenant-ID")) {
              proxyReq.setHeader("X-Tenant-ID", "global-admin");
            }
          });
        },
      },
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            proxyReq.removeHeader("origin");
            if (!proxyReq.getHeader("X-Tenant-ID")) {
              proxyReq.setHeader("X-Tenant-ID", "tenant-demo-1");
            }
          });
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
