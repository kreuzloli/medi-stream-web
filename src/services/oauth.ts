import { saveToken } from "./auth";

/**
 * 从当前 hash 路由里读取 query 参数。
 *
 * 示例：
 * #/wechat-live-play?token=abc
 */
export function getHashQueryParam(name: string): string | null {
    const hash = location.hash.replace("#", "");
    const queryString = hash.split("?")[1];

    if (!queryString) {
        console.info("[oauth] hash query not found", { name });
        return null;
    }

    const params = new URLSearchParams(queryString);
    const value = params.get(name);

    console.info("[oauth] get hash query param", {
        name,
        hasValue: Boolean(value),
    });

    return value;
}

/**
 * 从 URL 中读取 token 并保存。
 *
 * 保存成功后会清理 URL，避免 token 长时间暴露在地址栏。
 */
export function handleTokenFromHashUrl(cleanHashPath: string): boolean {
    const token = getHashQueryParam("token");

    if (!token) {
        console.info("[oauth] token not found in hash url");
        return false;
    }

    saveToken(token);

    const normalizedPath = cleanHashPath.startsWith("/")
        ? cleanHashPath
        : `/${cleanHashPath}`;

    history.replaceState(null, "", `#${normalizedPath}`);

    console.info("[oauth] token saved and hash url cleaned", {
        cleanHashPath: normalizedPath,
    });

    return true;
}

/**
 * 跳转到第三方 OAuth 授权入口。
 *
 * 这里传入完整授权 URL，方便复用到微信、GitHub 等登录场景。
 */
export function redirectToOAuth(oauthUrl: string) {
    console.info("[oauth] redirect to oauth", {
        oauthUrl,
    });

    location.href = oauthUrl;
}
