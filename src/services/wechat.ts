import { buildApiUrl } from "./api";

/**
 * 构建微信 OAuth 授权入口地址。
 *
 * redirectPath 是前端 hash 路由，例如：
 * /wechat-live
 */
export function buildWechatOAuthUrl(redirectPath: string): string {
    const redirect = encodeURIComponent(redirectPath);

    const url = buildApiUrl(`/wechat/oauth/authorize?redirect=${redirect}`);

    console.info("[wechat] build oauth url", {
        redirectPath,
        url,
    });

    return url;
}
