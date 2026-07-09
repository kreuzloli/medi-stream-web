import chevronIcon from "../../assets/icons/chevron-right.svg";
import { homeChoicenessItems, schematicUrl } from "../../data";
import type { ChoicenessItem } from "../../models/models";
import { defineElement, escapeHtml, icon } from "../../utils/utils";

/**
 * 首页精选专题列表。
 */
export class MediChoicenessList extends HTMLElement {
    private _items: ChoicenessItem[] = homeChoicenessItems;

    set items(value: ChoicenessItem[] | undefined) {
        this._items = value ?? homeChoicenessItems;
        console.info("[choiceness] items updated", {
            count: this._items.length,
            useFallback: !value,
        });
        this.render();
    }

    connectedCallback(): void {
        console.info("[choiceness] connected");
        this.render();
    }

    /**
     * 渲染精选专题区块。
     */
    private render(): void {
        const content = this._items.length === 0
            ? this.emptyState()
            : `
                <div class="choiceness-list">
                    ${this._items.map((item) => this.card(item)).join("")}
                </div>
            `;

        this.innerHTML = `
            <div class="live-align">
                <div class="live-title-wrap">
                    <h1 class="live-title-choiceness">精选专题</h1>
                    <button class="btn-more-choiceness" type="button">
                        <strong>更多专题</strong>
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
        console.warn("[choiceness] empty items");
        return `<div class="empty">暂无精选专题</div>`;
    }

    /**
     * 渲染专题卡片。当前 UI 图要求只保留封面和标题。
     */
    private card(item: ChoicenessItem): string {
        return `
            <div class="choiceness-card-cell">
                <div class="choiceness-card">
                    <div class="choiceness-card__cover">
                        <img src="${item.cover ?? schematicUrl}" alt="">
                    </div>
                    <div class="choiceness-card__body">
                        <div class="choiceness-card__title">${escapeHtml(item.title)}</div>
                    </div>
                </div>
            </div>
        `;
    }
}

defineElement("medi-choiceness-list", MediChoicenessList);
