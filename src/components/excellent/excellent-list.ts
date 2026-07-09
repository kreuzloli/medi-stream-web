import chevronIcon from "../../assets/icons/chevron-right.svg";
import { defaultExcellentItems, schematicUrl } from "../../data";
import type { ExcellentItem } from "../../models/models";
import { defineElement, escapeHtml, icon } from "../../utils/utils";

/**
 * 首页科普视频列表。
 */
export class MediExcellentList extends HTMLElement {
    private _items: ExcellentItem[] = defaultExcellentItems;

    set items(value: ExcellentItem[] | undefined) {
        this._items = value ?? defaultExcellentItems;
        console.info("[excellent] items updated", {
            count: this._items.length,
            useFallback: !value,
        });
        this.render();
    }

    connectedCallback(): void {
        console.info("[excellent] connected");
        this.render();
    }

    /**
     * 渲染科普视频区块。
     */
    private render(): void {
        const content = this._items.length === 0
            ? this.emptyState()
            : `<div class="excellent-list">${this._items.map((item) => this.card(item)).join("")}</div>`;

        this.innerHTML = `
            <div class="live-align">
                <div class="live-title-wrap">
                    <h1 class="live-title-excellent">科普视频</h1>
                    <button class="btn-more-excellent" type="button">
                        <strong>更多视频</strong>
                        ${icon(chevronIcon)}
                    </button>
                </div>
                ${content}
            </div>
        `;
    }

    /**
     * 渲染空状态，并记录接口返回空列表的排查线索。
     */
    private emptyState(): string {
        console.warn("[excellent] empty items");
        return `<div class="empty">暂无科普视频</div>`;
    }

    /**
     * 渲染单个视频卡片。
     */
    private card(item: ExcellentItem): string {
        const card = `
            <div class="excellent-card">
                <div class="excellent-card__body">
                    <img src="${item.cover ?? schematicUrl}" alt="excellent-background">
                    <div class="excellent-card__title">
                        <div class="excellent-card__titlefont">${escapeHtml(item.title)}</div>
                    </div>
                    ${item.badge ? `<div class="excellent-card__badge">${escapeHtml(item.badge)}</div>` : ""}
                </div>
            </div>
        `;

        return `
            <div class="excellent-card-cell">
                ${
                    item.href
                        ? `<a class="excellent-card__link" href="${escapeHtml(item.href)}" style="text-decoration: none;">${card}</a>`
                        : card
                }
            </div>
        `;
    }
}

defineElement("medi-excellent-list", MediExcellentList);
