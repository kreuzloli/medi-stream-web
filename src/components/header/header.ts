import accountIcon from "../../assets/icons/account.svg";
import logoUrl from "../../assets/images/logo_v2.jpg";
import searchIcon from "../../assets/icons/search.svg";
import { defineElement, icon } from "../../utils/utils";
import { isHeaderNavActive } from "./header-navigation";

/**
 * 首页顶部导航栏。
 */
export class MediHeader extends HTMLElement {
    connectedCallback(): void {
        console.info("[header] connected");
        this.render();
        window.addEventListener("hashchange", this.handleRouteChange);
    }

    disconnectedCallback(): void {
        window.removeEventListener("hashchange", this.handleRouteChange);
    }

    private readonly handleRouteChange = (): void => this.render();

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
                            <button class="header-btn header-user-info" type="button" aria-label="用户" title="用户">
                                ${icon(accountIcon)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
