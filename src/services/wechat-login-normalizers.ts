export const WECHAT_LOGIN_STATUSES = [
    "WAITING",
    "SCANNED",
    "SUCCESS",
    "REGISTER_REQUIRED",
    "EXPIRED",
] as const;

export type WechatLoginStatus = (typeof WECHAT_LOGIN_STATUSES)[number];

export type WechatQrResponse = {
    sessionId: string;
    qrUrl: string;
};

export type WechatLoginStatusResponse = {
    status: WechatLoginStatus;
    token?: string;
    registerToken?: string;
};

export type WechatLoginStatusPresentation = {
    tone: "pending" | "positive" | "warning" | "danger";
    label: string;
    description: string;
    terminal: boolean;
};

/**
 * 校验并转换后端 snake_case 二维码响应，避免页面直接依赖未经验证的 JSON。
 */
export function normalizeWechatQrResponse(value: unknown): WechatQrResponse {
    if (!isRecord(value) || !isNonEmptyString(value.session_id) || !isNonEmptyString(value.qr_url)) {
        throw new Error("微信二维码响应格式不正确");
    }

    return {
        sessionId: value.session_id,
        qrUrl: value.qr_url,
    };
}

/**
 * 校验后端登录状态，仅接受双方约定的状态值。
 */
export function normalizeWechatLoginStatusResponse(value: unknown): WechatLoginStatusResponse {
    if (!isRecord(value) || !isWechatLoginStatus(value.status)) {
        throw new Error("微信登录状态响应格式不正确");
    }

    return {
        status: value.status,
        ...(isNonEmptyString(value.token) ? { token: value.token } : {}),
        ...(isNonEmptyString(value.register_token) ? { registerToken: value.register_token } : {}),
    };
}

/**
 * 构建状态查询路径，session_id 必须作为单个路径参数编码。
 */
export function buildWechatStatusPath(sessionId: string): string {
    return `/wechat/status/${encodeURIComponent(sessionId)}`;
}

/**
 * 把后端状态映射为稳定的用户文案和轮询终止语义。
 */
export function getWechatLoginStatusPresentation(
    status: WechatLoginStatus,
): WechatLoginStatusPresentation {
    switch (status) {
        case "WAITING":
            return {
                tone: "pending",
                label: "等待扫码",
                description: "请使用手机微信扫一扫",
                terminal: false,
            };
        case "SCANNED":
            return {
                tone: "positive",
                label: "已扫码",
                description: "请在手机微信中继续操作",
                terminal: false,
            };
        case "SUCCESS":
            return {
                tone: "positive",
                label: "登录成功",
                description: "微信身份验证已完成",
                terminal: true,
            };
        case "REGISTER_REQUIRED":
            return {
                tone: "warning",
                label: "需要完善资料",
                description: "微信验证成功，请继续完成注册信息",
                terminal: true,
            };
        case "EXPIRED":
            return {
                tone: "danger",
                label: "二维码已过期",
                description: "请刷新二维码后重新扫码",
                terminal: true,
            };
    }
}

function isWechatLoginStatus(value: unknown): value is WechatLoginStatus {
    return typeof value === "string" && WECHAT_LOGIN_STATUSES.some((status) => status === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}
