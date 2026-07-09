import { defaultCategories } from "../../data";
import type { CategoryItem } from "../../models/models";
import { defineElement, escapeHtml } from "../../utils/utils";

/**
 * 首页左侧科室/疾病分类菜单。
 */
export class MediCategoryList extends HTMLElement {
    private _categories: CategoryItem[] | undefined;
    private previewCount = 7;
    private moreOpen = false;
    private activeIndex: number | null = null;

    set categories(value: CategoryItem[] | undefined) {
        this._categories = value;
        console.info("[category] categories updated", {
            count: value?.length ?? defaultCategories.length,
            useFallback: !value,
        });
        this.render();
    }

    connectedCallback(): void {
        console.info("[category] connected");
        this.render();
    }

    /**
     * 当前实际展示的分类数据。
     */
    private get activeCategories(): CategoryItem[] {
        return this._categories ?? defaultCategories;
    }

    /**
     * 渲染分类预览、更多面板和当前悬浮分类的二级菜单。
     */
    private render(): void {
        const categories = this.activeCategories;

        if (categories.length === 0) {
            console.warn("[category] empty categories");
            this.innerHTML = `<div class="empty">暂无分类</div>`;
            return;
        }

        const visible = categories.slice(0, this.previewCount);
        // 超过首屏预览数量时，保留“更多”入口让用户展开完整列表。
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

    /**
     * 绑定 hover 行为。
     *
     * 分类菜单依赖 hover 展开二级菜单，不能只靠 CSS，因为“更多”面板会改变数据范围。
     */
    private bindEvents(): void {
        const wrap = this.querySelector<HTMLElement>(".category-wrap");
        if (!wrap) {
            console.warn("[category] bind events failed, wrapper missing");
            return;
        }

        wrap.onmouseleave = () => {
            if (!this.moreOpen && this.activeIndex === null) {
                return;
            }

            this.moreOpen = false;
            this.activeIndex = null;
            console.info("[category] menu closed");
            this.render();
        };

        this.querySelectorAll<HTMLElement>(".category-row").forEach((row) => {
            row.onmouseenter = () => {
                const nextMoreOpen = row.dataset.action === "more" || row.dataset.scope === "m";
                const nextActiveIndex = row.dataset.action === "more" ? null : Number(row.dataset.index);
                const shouldRender = nextMoreOpen !== this.moreOpen;

                if (!shouldRender && nextActiveIndex === this.activeIndex) {
                    return;
                }

                this.moreOpen = nextMoreOpen;
                this.activeIndex = nextActiveIndex;

                if (!shouldRender) {
                    // 只切换同一面板里的活跃行时，局部更新 popup，避免整块菜单闪动。
                    this.syncPopup(row);
                    return;
                }

                console.info("[category] hover row", {
                    moreOpen: this.moreOpen,
                    activeIndex: this.activeIndex,
                });
                this.render();
            };
        });
    }

    /**
     * 渲染单行一级分类。
     */
    private row(item: CategoryItem, index: number, scope: "v" | "m"): string {
        return `
            <div class="category-row" data-index="${index}" data-scope="${scope}">
                <div class="category-dept">${escapeHtml(item.dept)}</div>
                <div class="category-topics">${escapeHtml(item.topics)}</div>
                <div class="category-arrow">›</div>
            </div>
        `;
    }

    /**
     * 渲染完整分类列表面板。
     */
    private morePanel(categories: CategoryItem[]): string {
        return `
            <div class="category-card-more">
                ${categories.map((item, index) => this.row(item, index, "m")).join("")}
            </div>
        `;
    }

    /**
     * 同步二级分类弹层位置。
     */
    private syncPopup(row: HTMLElement): void {
        this.querySelector(".category-popup")?.remove();

        const categories = this.activeCategories;
        if (this.activeIndex === null) {
            return;
        }

        const wrap = this.querySelector<HTMLElement>(".category-wrap");
        if (!wrap) {
            console.warn("[category] sync popup failed, wrapper missing");
            return;
        }

        const rowRect = row.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        // 弹层跟随当前 hover 行顶部，保证“更多”面板和普通面板都能复用同一套定位。
        wrap.insertAdjacentHTML("beforeend", this.popup(categories, rowRect.top - wrapRect.top));
    }

    /**
     * 渲染二级分类弹层。
     */
    private popup(categories: CategoryItem[], top?: number): string {
        if (this.activeIndex === null) {
            return "";
        }

        const item = categories[this.activeIndex];
        if (!item?.children.length) {
            console.info("[category] popup skipped, children empty", {
                activeIndex: this.activeIndex,
            });
            return "";
        }

        const popupTop = top ?? 6 + this.activeIndex * 44;
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
            <div class="category-popup" style="top: ${popupTop}px; left: calc(100% + 2px);">
                ${links}
            </div>
        `;
    }
}

defineElement("medi-category-list", MediCategoryList);
