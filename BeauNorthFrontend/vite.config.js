import { defineConfig } from "vite";
import plugin from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [plugin()],
    server: {
        port: 63146,
        watch: {
            usePolling: true
        },
        proxy: {
            "/api": {
                target: "http://localhost:5149",
                changeOrigin: true,
                secure: false
            }
        }
    },
    build: {
        outDir: "dist",
        emptyOutDir: true
    }
});