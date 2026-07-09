/**
 * 转义插入模板字符串的文本，避免业务数据破坏 HTML 结构。
 */
export function escapeHtml(value: string | number | undefined | null): string {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * 统一生成 SVG 图片标签。
 */
export function icon(url: string, className = "svg-icon", alt = ""): string {
    return `<img class="${className}" src="${url}" alt="${escapeHtml(alt)}">`;
}

/**
 * 安全注册 Web Component，避免热更新或重复 import 时重复 define 抛错。
 */
export function defineElement(name: string, constructor: CustomElementConstructor): void {
    if (!customElements.get(name)) {
        customElements.define(name, constructor);
        console.info("[custom-element] defined", {
            name,
        });

        return;
    }

    console.info("[custom-element] already defined", {
        name,
    });
}
