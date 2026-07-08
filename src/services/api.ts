/**
 * 后端 API 基础路径。
 *
 * 本地开发或生产环境可以通过 Vite 环境变量覆盖：
 * VITE_API_BASE=https://api.example.com
 *
 * 如果没有配置，默认走 /api，方便通过前端服务器或 Nginx 代理到后端。
 */
export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

/**
 * 拼接完整 API 地址。
 */
export function buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const url = `${API_BASE}${normalizedPath}`;

    console.info("[api] build api url", {
        apiBase: API_BASE,
        path: normalizedPath,
        url,
    });

    return url;
}
