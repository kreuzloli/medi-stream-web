import { defaultBanners } from "../../data";
import type { Banner } from "../../models/models";
import { defineElement, escapeHtml } from "../../utils/utils";

export class MediBannerCarousel extends HTMLElement {
    private _banners: Banner[] = defaultBanners;
    private activeIndex = 0;

    set banners(value: Banner[] | undefined) {
        this._banners = value ?? defaultBanners;
        this.activeIndex = 0;
        this.render();
    }

    connectedCallback(): void {
        this.render();
    }

    private render(): void {
        if (this._banners.length === 0) {
            this.innerHTML = `
                <div class="banner banner-empty">
                    <div class="banner-empty__text">暂无轮播内容</div>
                </div>
            `;
            return;
        }

        const banner = this._banners[this.activeIndex] ?? this._banners[0];
        const image = `<img class="banner-img" src="${banner.img}" alt="${escapeHtml(banner.alt ?? "")}">`;

        this.innerHTML = `
            <div class="banner">
                ${banner.href ? `<a class="banner-link" href="${escapeHtml(banner.href)}">${image}</a>` : image}
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
                this.render();
            });
        });
    }

    private move(delta: number): void {
        this.activeIndex = (this.activeIndex + this._banners.length + delta) % this._banners.length;
        this.render();
    }
}

defineElement("medi-banner-carousel", MediBannerCarousel);
