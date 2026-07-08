export const TOKEN_KEY = "token";

/**
 * 获取当前浏览器保存的 JWT token。
 */
export function getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);

    console.info("[auth] get token", {
        hasToken: Boolean(token),
    });

    return token;
}

/**
 * 保存后端返回的 JWT token。
 */
export function saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);

    console.info("[auth] token saved", {
        tokenLength: token.length,
    });
}

/**
 * 清除当前 JWT token。
 */
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);

    console.info("[auth] token cleared");
}

/**
 * 构建带 JWT 的请求头。
 */
export function buildAuthHeaders(): HeadersInit {
    const token = getToken();

    if (!token) {
        console.info("[auth] build headers without token");
        return {};
    }

    console.info("[auth] build headers with bearer token");

    return {
        Authorization: `Bearer ${token}`,
    };
}
