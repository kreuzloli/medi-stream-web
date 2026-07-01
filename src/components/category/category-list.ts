import { defaultCategories } from "../../data";
import type { CategoryItem } from "../../models/models";
import { defineElement, escapeHtml } from "../../utils/utils";

export class MediCategoryList extends HTMLElement {
    private _categories: CategoryItem[] | undefined;
    private previewCount = 7;
    private moreOpen = false;
    private activeIndex: number | null = null;

    set categories(value: CategoryItem[] | undefined) {
        this._categories = value;
        this.render();
    }

    connectedCallback(): void {
        this.render();
    }

    private get activeCategories(): CategoryItem[] {
        return this._categories ?? defaultCategories;
    }

    private render(): void {
        const categories = this.activeCategories;

        if (categories.length === 0) {
            this.innerHTML = `<div class="empty">暂无分类</div>`;
            return;
        }

        const visible = categories.slice(0, this.previewCount);
        const hasMore = categories.length > this.previewCount;

        this.innerHTML = `
            <div class="category-wrap">
                <div class="category-card">
                    ${visible.map((item, index) => this.row(item, index, "v")).join("")}
                    ${
                        hasMore
                            ? `
                                <div class="category-row is-more" data-action="more">
                                    <div class="category-dept">更多</div>
                                    <div class="category-topics"></div>
                                    <div class="category-arrow">›</div>
                                </div>
                            `
                            : ""
                    }
                </div>
                ${this.moreOpen ? this.morePanel(categories) : ""}
                ${this.popup(categories)}
            </div>
        `;

        this.bindEvents();
    }

    private bindEvents(): void {
        const wrap = this.querySelector<HTMLElement>(".category-wrap");
        if (!wrap) {
            return;
        }

        wrap.onmouseleave = () => {
            this.moreOpen = false;
            this.activeIndex = null;
            this.render();
        };

        this.querySelectorAll<HTMLElement>(".category-row").forEach((row) => {
            row.onmouseenter = () => {
                if (row.dataset.action === "more") {
                    this.moreOpen = true;
                    this.activeIndex = null;
                } else {
                    this.moreOpen = row.dataset.scope === "m";
                    this.activeIndex = Number(row.dataset.index);
                }
                this.render();
            };
        });
    }

    private row(item: CategoryItem, index: number, scope: "v" | "m"): string {
        return `
            <div class="category-row" data-index="${index}" data-scope="${scope}">
                <div class="category-dept">${escapeHtml(item.dept)}</div>
                <div class="category-topics">${escapeHtml(item.topics)}</div>
                <div class="category-arrow">›</div>
            </div>
        `;
    }

    private morePanel(categories: CategoryItem[]): string {
        return `
            <div class="category-card-more">
                ${categories.map((item, index) => this.row(item, index, "m")).join("")}
            </div>
        `;
    }

    private popup(categories: CategoryItem[]): string {
        if (this.activeIndex === null) {
            return "";
        }

        const item = categories[this.activeIndex];
        if (!item?.children.length) {
            return "";
        }

        const top = 6 + this.activeIndex * 44;
        const links = item.children
            .map(
                (child) => `
                    <a class="category-popup-item" href="${escapeHtml(child.href)}">
                        ${escapeHtml(child.dept)}
                    </a>
                `,
            )
            .join("");

        return `
            <div class="category-popup" style="top: ${top}px; left: calc(100% + 2px);">
                ${links}
            </div>
        `;
    }
}

defineElement("medi-category-list", MediCategoryList);
