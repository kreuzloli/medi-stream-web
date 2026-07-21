import { buildApiUrl } from "./api";

export const TOKEN_KEY = "token";
export const AUTH_STATE_CHANGED_EVENT = "medi-auth-state-changed";

export type UserProfile = {
    id?: number;
    realName: string;
    nickname?: string;
    mobile?: string;
    headerId?: number;
};

export type AccountDetail = {
    profile: UserProfile;
};

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
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT, { detail: { authenticated: true } }));
}

/**
 * 清除当前 JWT token。
 */
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);

    console.info("[auth] token cleared");
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT, { detail: { authenticated: false } }));
}

/** 查询当前登录用户资料。 */
export async function fetchCurrentAccount(signal?: AbortSignal): Promise<AccountDetail> {
    const response = await fetch(buildApiUrl("/account"), {
        headers: buildAuthHeaders(),
        credentials: "include",
        signal,
    });
    if (!response.ok) {
        throw new Error(`读取用户信息失败，HTTP ${response.status}`);
    }
    const account = await response.json() as AccountDetail | null;
    if (!account?.profile) {
        throw new Error("当前用户信息不存在");
    }
    console.info("[auth] current account loaded", {
        userId: account.profile.id,
        realName: account.profile.realName,
        nickname: account.profile.nickname,
        headerId: account.profile.headerId,
    });
    return account;
}

/** 使用 Bearer Token 读取私有头像或证件，并返回浏览器 Blob URL。 */
export async function fetchPrivateFileUrl(fileId: number, signal?: AbortSignal): Promise<string> {
    const response = await fetch(buildApiUrl(`/files/${encodeURIComponent(fileId)}/content`), {
        headers: buildAuthHeaders(),
        credentials: "include",
        signal,
    });
    if (!response.ok) {
        throw new Error(`读取文件失败，HTTP ${response.status}`);
    }
    return URL.createObjectURL(await response.blob());
}

/** 请求后端使当前 Token 失效，并始终清除浏览器本地登录态。 */
export async function logout(): Promise<void> {
    try {
        const response = await fetch(buildApiUrl("/auth/logout"), {
            method: "POST",
            headers: buildAuthHeaders(),
            credentials: "include",
        });
        console.info("[auth] logout request completed", { status: response.status });
    } catch (error) {
        // 后端不可达时也必须允许用户清除本地登录态，避免页面一直卡在已登录状态。
        console.warn("[auth] logout request failed, local token will still be cleared", {
            message: error instanceof Error ? error.message : String(error),
        });
    } finally {
        clearToken();
    }
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
