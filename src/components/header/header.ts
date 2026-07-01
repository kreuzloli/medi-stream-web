import accountIcon from "../../assets/icons/account.svg";
import calendarIcon from "../../assets/icons/calendar-check.svg";
import folderIcon from "../../assets/icons/folder.svg";
import historyIcon from "../../assets/icons/clipboard-clock.svg";
import logoUrl from "../../assets/images/logo_v2.jpg";
import searchIcon from "../../assets/icons/search.svg";
import starIcon from "../../assets/icons/star.svg";
import { defineElement, icon } from "../../utils/utils";

export class MediHeader extends HTMLElement {
    connectedCallback(): void {
        this.render();
    }

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
                            <a href="/review">精彩回顾</a>
                            <a href="/videos">科普视频</a>
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
                        ${this.actionButton(historyIcon, "历史记录")}
                        ${this.actionButton(starIcon, "收藏")}
                        ${this.actionButton(folderIcon, "文件夹")}
                        ${this.actionButton(calendarIcon, "日历")}
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

    private actionButton(iconUrl: string, title: string): string {
        return `
            <button class="header-btn header-action" type="button" aria-label="${title}" title="${title}">
                ${icon(iconUrl)}
            </button>
        `;
    }
}

defineElement("medi-header", MediHeader);
