import chevronIcon from "../../assets/icons/chevron-right.svg";
import { defaultExcellentItems, schematicUrl } from "../../data";
import type { ExcellentItem } from "../../models/models";
import { defineElement, escapeHtml, icon } from "../../utils/utils";

export class MediExcellentList extends HTMLElement {
    private _items: ExcellentItem[] = defaultExcellentItems;

    set items(value: ExcellentItem[] | undefined) {
        this._items = value ?? defaultExcellentItems;
        this.render();
    }

    connectedCallback(): void {
        this.render();
    }

    private render(): void {
        this.innerHTML = `
            <div class="live-align">
                <div class="live-title-wrap">
                    <h1 class="live-title-excellent">精彩视频</h1>
                    <button class="btn-more-excellent" type="button">
                        <strong>更多视频</strong>
                        ${icon(chevronIcon)}
                    </button>
                </div>
                ${
                    this._items.length === 0
                        ? `<div class="empty">暂无精彩视频</div>`
                        : `<div class="excellent-list">${this._items.map((item) => this.card(item)).join("")}</div>`
                }
            </div>
        `;
    }

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
