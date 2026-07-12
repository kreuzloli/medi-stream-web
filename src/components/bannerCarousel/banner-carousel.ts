import { defaultBanners } from "../../data";
import type { Banner } from "../../models/models";
import { defineElement, escapeHtml } from "../../utils/utils";

/**
 * 首页顶部轮播组件。
 */
export class MediBannerCarousel extends HTMLElement {
    private _banners: Banner[] = defaultBanners;
    private _displayMode: "home" | "content" = "home";
    private activeIndex = 0;

    set banners(value: Banner[] | undefined) {
        this._banners = value ?? defaultBanners;
        this.activeIndex = 0;
        console.info("[banner] banners updated", {
            count: this._banners.length,
            useFallback: !value,
        });
        this.render();
    }

    set displayMode(value: "home" | "content" | undefined) {
        this._displayMode = value ?? "home";
        this.render();
    }

    connectedCallback(): void {
        console.info("[banner] connected");
        this.render();
    }

    /**
     * 渲染当前轮播图，并在多图时绑定切换按钮。
     */
    private render(): void {
        if (this._banners.length === 0) {
            console.warn("[banner] empty banners");
            this.innerHTML = `
                <div class="banner banner-empty">
                    <div class="banner-empty__text">暂无轮播内容</div>
                </div>
            `;
            return;
        }

        const banner = this._banners[this.activeIndex] ?? this._banners[0];
        const image = `<img class="banner-img" src="${banner.img}" alt="${escapeHtml(banner.alt ?? "")}">`;
        const backdrop = this._displayMode === "content"
            ? `<img class="banner-backdrop" src="${banner.img}" alt="" aria-hidden="true">`
            : "";

        this.innerHTML = `
            <div class="banner banner--${this._displayMode}">
                ${backdrop}
                <div class="banner-foreground">
                    ${banner.href ? `<a class="banner-link" href="${escapeHtml(banner.href)}">${image}</a>` : image}
                </div>
                ${
                    this._banners.length > 1
                        ? `
                            <button class="banner-nav banner-nav-prev" type="button" aria-label="上一张">‹</button>
                            <button class="banner-nav banner-nav-next" type="button" aria-label="下一张">›</button>
                            <div class="banner-dots">
                                ${this._banners
                                    .map(
                                        (_, index) => `
                                            <button
                                                class="banner-dot ${index === this.activeIndex ? "is-active" : ""}"
                                                type="button"
                                                data-index="${index}"
                                                aria-label="切换轮播"
                                            ></button>
                                        `,
                                    )
                                    .join("")}
                            </div>
                        `
                        : ""
                }
            </div>
        `;

        this.querySelector(".banner-nav-prev")?.addEventListener("click", () => this.move(-1));
        this.querySelector(".banner-nav-next")?.addEventListener("click", () => this.move(1));
        this.querySelectorAll<HTMLElement>(".banner-dot").forEach((dot) => {
            dot.addEventListener("click", () => {
                this.activeIndex = Number(dot.dataset.index);
                console.info("[banner] dot clicked", {
                    activeIndex: this.activeIndex,
                });
                this.render();
            });
        });
    }

    /**
     * 前后切换轮播图；取模保证第一张和最后一张可以闭环切换。
     */
    private move(delta: number): void {
        this.activeIndex = (this.activeIndex + this._banners.length + delta) % this._banners.length;
        console.info("[banner] move", {
            delta,
            activeIndex: this.activeIndex,
        });
        this.render();
    }
}

defineElement("medi-banner-carousel", MediBannerCarousel);
