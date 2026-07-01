import chevronIcon from "../../assets/icons/chevron-right.svg";
import clockIcon from "../../assets/icons/clock.svg";
import starIcon from "../../assets/icons/star.svg";
import { homeChoicenessItems, schematicUrl } from "../../data";
import type { ChoicenessItem } from "../../models";
import { defineElement, escapeHtml, icon } from "../../utils/utils";

export class MediChoicenessList extends HTMLElement {
    private _items: ChoicenessItem[] = homeChoicenessItems;
    private followedIds = new Set<number>();

    set items(value: ChoicenessItem[] | undefined) {
        this._items = value ?? homeChoicenessItems;
        this.render();
    }

    connectedCallback(): void {
        this.render();
    }

    private render(): void {
        this.innerHTML = `
            <div class="live-align">
                <div class="live-title-wrap">
                    <h1 class="live-title-choiceness">精选专题</h1>
                    <button class="btn-more-choiceness" type="button">
                        <strong>更多专题</strong>
                        ${icon(chevronIcon)}
                    </button>
                </div>

                ${
                    this._items.length === 0
                        ? `<div class="empty">暂无精选专题</div>`
                        : `
                            <div class="choiceness-list">
                                ${this._items.map((item) => this.card(item)).join("")}
                            </div>
                        `
                }
            </div>
        `;

        this.querySelectorAll<HTMLButtonElement>(".btn-more-attention").forEach((button) => {
            button.addEventListener("click", () => {
                const id = Number(button.dataset.id);
                if (this.followedIds.has(id)) {
                    this.followedIds.delete(id);
                } else {
                    this.followedIds.add(id);
                }
                this.render();
            });
        });
    }

    private card(item: ChoicenessItem): string {
        const isFollowed = this.followedIds.has(item.id);
        const minors = item.minors
            .slice(0, 3)
            .map((minor) => `<div class="choiceness-card-minor__title">${escapeHtml(minor)}</div>`)
            .join("");

        return `
            <div class="choiceness-card-cell">
                <div class="choiceness-card">
                    <div class="choiceness-card__cover">
                        <img src="${item.cover ?? schematicUrl}" alt="">
                    </div>
                    <div class="choiceness-card__body">
                        <div class="choiceness-card__title">${escapeHtml(item.title)}</div>
                    </div>
                    <div class="choiceness-info__body">
                        <div class="choiceness-card__info">
                            <img class="icon icon-clock" src="${clockIcon}" alt="">
                            <span>${escapeHtml(item.latestText)}</span>
                            <button
                                type="button"
                                data-id="${item.id}"
                                class="btn-more-attention ${isFollowed ? "is-followed" : ""}"
                            >
                                ${isFollowed ? "" : `<img class="svg-icon star-icon" src="${starIcon}" alt="">`}
                                <strong>${isFollowed ? "已关注" : "关注"}</strong>
                            </button>
                        </div>
                    </div>
                    <div class="choiceness-card-minor__body">
                        ${minors}
                    </div>
                </div>
            </div>
        `;
    }
}

defineElement("medi-choiceness-list", MediChoicenessList);
