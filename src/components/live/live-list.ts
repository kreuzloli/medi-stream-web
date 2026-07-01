import chevronIcon from "../../assets/icons/chevron-right.svg";
import clockIcon from "../../assets/icons/clock.svg";
import playIcon from "../../assets/icons/icon-video-play-square.svg";
import { homeLiveItems, schematicUrl } from "../../data";
import type { LiveItem } from "../../models/models";
import { defineElement, escapeHtml, icon } from "../../utils/utils";

export class MediLiveList extends HTMLElement {
    private _items: LiveItem[] = homeLiveItems;

    set items(value: LiveItem[] | undefined) {
        this._items = value ?? homeLiveItems;
        this.render();
    }

    connectedCallback(): void {
        this.render();
    }

    private render(): void {
        this.innerHTML = `
            <div class="live-align">
                <div class="live-title-wrap">
                    <h1 class="live-title-medi">近期直播</h1>
                    <button class="btn-more-live" type="button">
                        <strong>更多直播</strong>
                        ${icon(chevronIcon)}
                    </button>
                </div>

                ${
                    this._items.length === 0
                        ? `<div class="empty">暂无近期直播</div>`
                        : `
                            <div class="live-timeline-wrap">
                                ${this._items.map((item) => this.timeline(item)).join("")}
                            </div>
                            <div class="live-list">
                                ${this._items.map((item) => this.card(item)).join("")}
                            </div>
                        `
                }
            </div>
        `;
    }

    private timeline(item: LiveItem): string {
        const accentClass = item.isToday ? "is-today" : "is-future";
        return `
            <div class="live-timeline-cell">
                <div class="timeline-node ${accentClass}">
                    <div class="timeline-line"></div>
                    <div class="timeline-pill">
                        <img src="${clockIcon}" alt="" class="timeline-icon">
                        <span>${escapeHtml(item.label)}</span>
                    </div>
                    <div class="timeline-time">${escapeHtml(item.time)}</div>
                </div>
            </div>
        `;
    }

    private card(item: LiveItem): string {
        const isLive = (item.status ?? (item.isToday ? "LIVE" : "WAIT")) === "LIVE";
        const cover = item.cover ?? schematicUrl;

        return `
            <div class="live-card-cell">
                <div class="live-card">
                    <div class="live-card__cover">
                        <img src="${cover}" alt="">
                        ${
                            isLive
                                ? `
                                    <div class="live-card__badge">
                                        <img class="svg-icon live-card__video" src="${playIcon}" alt="">
                                        直播中
                                    </div>
                                `
                                : `
                                    <div class="live-card__badge_wait">
                                        <div class="live-card__badge__title">距开播</div>
                                        <div class="live-card__badge__time">${escapeHtml(item.waitText ?? "—")}</div>
                                    </div>
                                `
                        }
                    </div>
                    <div class="live-card__body">
                        <div class="live-card__title">${escapeHtml(item.title)}</div>
                        <button class="live-card__btn" type="button">进入直播间</button>
                    </div>
                </div>
            </div>
        `;
    }
}

defineElement("medi-live-list", MediLiveList);
