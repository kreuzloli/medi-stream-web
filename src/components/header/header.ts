import accountIcon from "../../assets/icons/account.svg";
import logoUrl from "../../assets/images/logo_v2.jpg";
import searchIcon from "../../assets/icons/search.svg";
import { defineElement, icon } from "../../utils/utils";

/**
 * 首页顶部导航栏。
 */
export class MediHeader extends HTMLElement {
    connectedCallback(): void {
        console.info("[header] connected");
        this.render();
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
                            <a href="/" class="active">首页</a>
                            <a href="/topics">精选专题</a>
                            <a href="/training">科研培训</a>
                            <a href="/certificates">证书查询</a>
                            <a href="/videos">科普视频</a>
                            <a href="/about">关于我们</a>
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
}

defineElement("medi-header", MediHeader);
