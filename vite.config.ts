import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
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
        headers: {
          "X-Tenant-ID": "global-admin",
        },
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            proxyReq.removeHeader("origin");
          });
        },
      },
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        headers: {
          "X-Tenant-ID": "tenant-demo-1",
        },
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            proxyReq.removeHeader("origin");
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
