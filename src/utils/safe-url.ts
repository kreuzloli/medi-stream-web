/**
 * 仅允许页面需要的 HTTP(S)、Hash 和站内相对地址，阻止业务数据注入可执行协议。
 */
export function safeUrl(value: string | undefined): string {
    const url = value?.trim() ?? "";

    if (!url) {
        return "";
    }

    if (/["'<>`\u0000-\u001F\u007F]/.test(url)) {
        return "";
    }

    if (url.startsWith("#") || url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
        return url;
    }

    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : "";
    } catch {
        return "";
    }
}
