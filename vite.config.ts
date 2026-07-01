import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, ".", "");
    const proxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8080";

    return {
        server: {
            host: "127.0.0.1",
            port: 3000,
            proxy: {
                "/api": {
                    target: proxyTarget,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, ""),
                },
            },
        },
    };
});
