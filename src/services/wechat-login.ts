import { buildApiUrl } from "./api";
import {
    buildWechatStatusPath,
    normalizeWechatLoginStatusResponse,
    normalizeWechatQrResponse,
    type WechatLoginStatusResponse,
    type WechatQrResponse,
} from "./wechat-login-normalizers";

/**
 * 创建微信扫码登录会话。
 *
 * 返回的 qrUrl 只交给本地二维码组件绘制，不写入日志或发送给第三方服务。
 */
export async function fetchWechatQrCode(signal?: AbortSignal): Promise<WechatQrResponse> {
    console.info("[wechat-login] qrcode request started");
    const response = await fetch(buildApiUrl("/wechat/qrcode"), { signal });

    if (!response.ok) {
        console.warn("[wechat-login] qrcode request failed", {
            status: response.status,
        });
        throw new Error(`获取微信二维码失败（${response.status}）`);
    }

    const result = normalizeWechatQrResponse(await response.json() as unknown);
    console.info("[wechat-login] qrcode request succeeded", {
        hasSession: Boolean(result.sessionId),
    });
    return result;
}

/**
 * 查询微信扫码登录会话状态。
 */
export async function fetchWechatLoginStatus(
    sessionId: string,
    signal?: AbortSignal,
): Promise<WechatLoginStatusResponse> {
    const response = await fetch(buildApiUrl(buildWechatStatusPath(sessionId)), { signal });

    if (!response.ok) {
        console.warn("[wechat-login] status request failed", {
            status: response.status,
        });
        throw new Error(`查询微信登录状态失败（${response.status}）`);
    }

    return normalizeWechatLoginStatusResponse(await response.json() as unknown);
}
