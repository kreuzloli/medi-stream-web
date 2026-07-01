export function escapeHtml(value: string | number | undefined | null): string {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function icon(url: string, className = "svg-icon", alt = ""): string {
    return `<img class="${className}" src="${url}" alt="${escapeHtml(alt)}">`;
}

export function defineElement(name: string, constructor: CustomElementConstructor): void {
    if (!customElements.get(name)) {
        customElements.define(name, constructor);
    }
}
