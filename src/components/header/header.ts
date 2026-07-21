import accountIcon from "../../assets/icons/account.svg";
import logoUrl from "../../assets/images/logo_v2.jpg";
import searchIcon from "../../assets/icons/search.svg";
import {
    AUTH_STATE_CHANGED_EVENT,
    fetchCurrentAccount,
    fetchPrivateFileUrl,
    getToken,
    logout,
    type AccountDetail,
} from "../../services/auth";
import { defineElement, escapeHtml, icon } from "../../utils/utils";
import { isHeaderNavActive } from "./header-navigation";

/**
 * 首页顶部导航栏。
 */
export class MediHeader extends HTMLElement {
    private account: AccountDetail | null = null;
    private avatarUrl = "";
    private menuOpen = false;
    private loadVersion = 0;

    connectedCallback(): void {
        console.info("[header] connected");
        this.render();
        window.addEventListener("hashchange", this.handleRouteChange);
        window.addEventListener(AUTH_STATE_CHANGED_EVENT, this.handleAuthChange);
        void this.loadAccount();
    }

    disconnectedCallback(): void {
        window.removeEventListener("hashchange", this.handleRouteChange);
        window.removeEventListener(AUTH_STATE_CHANGED_EVENT, this.handleAuthChange);
        this.revokeAvatarUrl();
    }

    private readonly handleRouteChange = (): void => this.render();
    private readonly handleAuthChange = (): void => void this.loadAccount();

    /** 根据本地登录态刷新用户资料和私有头像。 */
    private async loadAccount(): Promise<void> {
        const version = ++this.loadVersion;
        this.account = null;
        this.menuOpen = false;
        this.revokeAvatarUrl();
        this.render();
        if (!getToken()) return;
        try {
            const account = await fetchCurrentAccount();
            if (version !== this.loadVersion || !this.isConnected) return;
            this.account = account;
            if (account.profile.headerId) {
                this.avatarUrl = await fetchPrivateFileUrl(account.profile.headerId);
            }
            if (version !== this.loadVersion || !this.isConnected) {
                this.revokeAvatarUrl();
                return;
            }
            this.render();
        } catch (error) {
            console.warn("[header] account load failed", {
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * 渲染导航、搜索框和用户入口。
     */
    private render(): void {
        this.innerHTML = `
            <div class="header-shell">
                <div class="header">
                    <div class="header-left">
                        <div class="header-logo">
                            <img alt="medi-stream" src="${logoUrl}">
                        </div>
                        <nav class="header-nav">
                            ${this.navLink("/", "首页")}
                            ${this.navLink("/topics", "精选专题")}
                            ${this.navLink("/training", "科研培训")}
                            ${this.navLink("/certificates", "证书查询")}
                            ${this.navLink("/videos", "科普视频")}
                            ${this.navLink("/about", "关于我们")}
                        </nav>
                    </div>

                    <div class="header-center">
                        <div class="header-search">
                            <input placeholder="请输入搜索内容">
                            <button class="search-btn" type="button" aria-label="search">
                                ${icon(searchIcon)}
                            </button>
                        </div>
                    </div>

                    <div class="header-right">
                        <div class="header-container">
                            <button
                                class="header-btn header-user-info"
                                type="button"
                                data-user-entry
                                aria-label="${this.account ? "用户菜单" : "微信扫码登录"}"
                                title="${this.account ? escapeHtml(this.displayName()) : "微信扫码登录"}"
                            >
                                ${this.avatarUrl
                                    ? `<img class="header-avatar" src="${escapeHtml(this.avatarUrl)}" alt="用户头像">`
                                    : icon(accountIcon)}
                            </button>
                            ${this.account && this.menuOpen ? this.renderUserMenu() : ""}
                        </div>
                    </div>
                </div>
            </div>
            <wechat-login-dialog></wechat-login-dialog>
        `;

        this.bindUserEntry();
    }

    /**
     * 用户图标只负责打开扫码弹窗，二维码请求和轮询由弹窗组件独立管理。
     */
    private bindUserEntry(): void {
        this.querySelector("[data-user-entry]")?.addEventListener("click", () => {
            if (this.account) {
                this.menuOpen = !this.menuOpen;
                console.info("[header] user menu toggled", {
                    userId: this.account.profile.id,
                    open: this.menuOpen,
                });
                this.render();
                return;
            }
            const dialog = this.querySelector<HTMLElement & { open: () => void }>("wechat-login-dialog");

            if (!dialog) {
                console.error("[header] wechat login dialog not found");
                return;
            }

            console.info("[header] wechat login entry clicked");
            dialog.open();
        });
        this.querySelector("[data-logout]")?.addEventListener("click", async () => {
            console.info("[header] logout clicked", {
                userId: this.account?.profile.id,
                realName: this.account?.profile.realName,
                nickname: this.account?.profile.nickname,
            });
            await logout();
        });
    }

    private renderUserMenu(): string {
        return `<div class="header-user-menu">
            <div class="header-user-summary">
                <strong>${escapeHtml(this.displayName())}</strong>
                <span>${escapeHtml(this.account?.profile.realName || "已登录用户")}</span>
            </div>
            <button type="button" data-logout>退出登录</button>
        </div>`;
    }

    private displayName(): string {
        return this.account?.profile.nickname || this.account?.profile.realName || "已登录用户";
    }

    private revokeAvatarUrl(): void {
        if (this.avatarUrl) {
            URL.revokeObjectURL(this.avatarUrl);
            this.avatarUrl = "";
        }
    }

    /**
     * 使用 hash 链接保持与项目路由器一致，并按当前栏目计算激活状态。
     */
    private navLink(path: string, label: string): string {
        const currentPath = location.hash.replace(/^#/, "").split("?")[0] || "/";
        const active = isHeaderNavActive(path, currentPath);

        return `<a href="#${path}" class="${active ? "active" : ""}">${label}</a>`;
    }
}

defineElement("medi-header", MediHeader);
