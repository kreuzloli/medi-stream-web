import chevronIcon from "../../assets/icons/chevron-right.svg";
import clockIcon from "../../assets/icons/clock.svg";
import playIcon from "../../assets/icons/icon-video-play-square.svg";
import { homeLiveItems, schematicUrl } from "../../data";
import type { LiveItem } from "../../models/models";
import { defineElement, escapeHtml, icon } from "../../utils/utils";

/**
 * 首页近期直播列表。
 */
export class MediLiveList extends HTMLElement {
    private _items: LiveItem[] = homeLiveItems;

    set items(value: LiveItem[] | undefined) {
        this._items = value ?? homeLiveItems;
        console.info("[live-list] items updated", {
            count: this._items.length,
            useFallback: !value,
        });
        this.render();
    }

    connectedCallback(): void {
        console.info("[live-list] connected");
        this.render();
    }

    /**
     * 渲染直播区块。
     */
    private render(): void {
        const content = this._items.length === 0
            ? this.emptyState()
            : `
                <div class="live-list">
                    ${this._items.map((item) => this.item(item)).join("")}
                </div>
            `;

        this.innerHTML = `
            <div class="live-align">
                <div class="live-title-wrap">
                    <h1 class="live-title-medi">近期直播</h1>
                    <button class="btn-more-live" type="button">
                        <strong>更多直播</strong>
                        ${icon(chevronIcon)}
                    </button>
                </div>
                ${content}
            </div>
        `;

        this.querySelector(".btn-more-live")?.addEventListener("click", () => {
            location.hash = "/live-list";
        });
    }

    /**
     * 渲染空状态，并记录接口返回空列表的排查线索。
     */
    private emptyState(): string {
        console.warn("[live-list] empty items");
        return `<div class="empty">暂无近期直播</div>`;
    }

    /**
     * 每条直播由时间轴节点和直播卡片组成，保证第二排卡片也有自己的时间节点。
     */
    private item(item: LiveItem): string {
        return `
            <div class="live-item">
                ${this.timeline(item)}
                ${this.card(item)}
            </div>
        `;
    }

    /**
     * 渲染单条直播上方的时间轴节点。
     */
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

    /**
     * 渲染直播卡片。
     */
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
