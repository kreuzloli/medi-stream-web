/** 返回当前 hash 路由，供登录或注册完成后回到原页面。 */
export function currentReturnPath(): string {
    return normalizeReturnPath(location.hash.replace(/^#/, "") || "/");
}

/** 只接受站内 hash 路由，避免登录完成后跳转到外部地址。 */
export function normalizeReturnPath(value: string | null | undefined): string {
    const decoded = value ? safeDecode(value) : "/";
    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
        return "/";
    }
    return decoded;
}

export function withReturnTo(path: string, returnTo: string): string {
    return `${path}?returnTo=${encodeURIComponent(normalizeReturnPath(returnTo))}`;
}

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return "/";
    }
}
