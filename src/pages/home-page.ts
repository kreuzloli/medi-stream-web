import "../components/bannerCarousel/banner-carousel";
import "../components/category/category-list";
import "../components/choiceness/choiceness-list";
import "../components/excellent/excellent-list";
import "../components/footer/footer";
import "../components/header/header";
import "../components/live/live-list";

import { defaultBanners, defaultExcellentItems, homeChoicenessItems, homeLiveItems } from "../data";
import type { Banner, CategoryItem, ChoicenessItem, ExcellentItem, LiveItem } from "../models/models";
import { fetchBanners } from "../services/banner";
import { fetchCatalogCategories } from "../services/catalog";
import { fetchHomeContent } from "../services/home";

/**
 * 首页页面组件。
 *
 * 页面先渲染静态骨架，再异步加载目录和首页内容；接口失败时继续使用本地假数据兜底。
 */
class HomePage extends HTMLElement {
    private categories: CategoryItem[] | undefined;
    private bannerItems: Banner[] = defaultBanners;
    private liveItems: LiveItem[] = homeLiveItems;
    private choicenessItems: ChoicenessItem[] = homeChoicenessItems;
    private excellentItems: ExcellentItem[] = defaultExcellentItems;
    private loading = false;

    connectedCallback(): void {
        console.info("[home-page] connected");
        this.render();
        void this.loadCategories();
        void this.loadBanners();
        void this.loadHomeContent();
    }

    /**
     * 加载左侧目录分类。
     */
    private async loadCategories(): Promise<void> {
        this.loading = true;
        this.render();

        try {
            console.info("[home-page] load categories start");
            this.categories = await fetchCatalogCategories();
            console.info("[home-page] load categories success", {
                count: this.categories.length,
            });
        } catch (error) {
            this.categories = undefined;
            console.warn("[home] use fallback categories", {
                message: error instanceof Error ? error.message : String(error),
            });
        } finally {
            this.loading = false;
            this.render();
        }
    }

    /**
     * 加载首页轮播图。
     */
    private async loadBanners(): Promise<void> {
        try {
            console.info("[home-page] load banners start", {
                placement: "home",
            });

            this.bannerItems = withFallback(await fetchBanners("home"), defaultBanners);

            console.info("[home-page] load banners success", {
                count: this.bannerItems.length,
            });
        } catch (error) {
            console.warn("[home] use fallback banners", {
                message: error instanceof Error ? error.message : String(error),
            });

            this.bannerItems = defaultBanners;
        } finally {
            this.render();
        }
    }

    /**
     * 加载近期直播、精选专题、科普视频。
     */
    private async loadHomeContent(): Promise<void> {
        try {
            console.info("[home-page] load home content start");
            const content = await fetchHomeContent();

            this.liveItems = withFallback(content.liveItems, homeLiveItems);
            this.choicenessItems = withFallback(content.choicenessItems, homeChoicenessItems);
            this.excellentItems = withFallback(content.excellentItems, defaultExcellentItems);

            console.info("[home-page] load home content success", {
                liveCount: this.liveItems.length,
                choicenessCount: this.choicenessItems.length,
                excellentCount: this.excellentItems.length,
            });
        } catch (error) {
            console.warn("[home] use fallback home content", {
                message: error instanceof Error ? error.message : String(error),
            });

            this.liveItems = homeLiveItems;
            this.choicenessItems = homeChoicenessItems;
            this.excellentItems = defaultExcellentItems;
        } finally {
            this.render();
        }
    }

    /**
     * 渲染首页框架，并把最新数据传给子组件。
     */
    private render(): void {
        this.innerHTML = `
            <div class="App">
                <medi-header></medi-header>
                <div class="app-home">
                    <aside class="app-left">
                        <medi-category-list></medi-category-list>
                        ${this.loading ? `<div class="state-text">加载中...</div>` : ""}
                    </aside>
                    <main class="app-right">
                        <div class="banner-wrap">
                            <medi-banner-carousel></medi-banner-carousel>
                        </div>
                    </main>
                </div>
                <medi-live-list></medi-live-list>
                <medi-choiceness-list></medi-choiceness-list>
                <medi-excellent-list></medi-excellent-list>
                <medi-footer></medi-footer>
            </div>
        `;

        const category = this.querySelector("medi-category-list") as HTMLElement & {
            categories?: CategoryItem[];
        };
        category.categories = this.categories;

        const banner = this.querySelector("medi-banner-carousel") as HTMLElement & {
            banners?: Banner[];
        };
        banner.banners = this.bannerItems;

        const live = this.querySelector("medi-live-list") as HTMLElement & {
            items?: LiveItem[];
        };
        live.items = this.liveItems;

        const choiceness = this.querySelector("medi-choiceness-list") as HTMLElement & {
            items?: ChoicenessItem[];
        };
        choiceness.items = this.choicenessItems;

        const excellent = this.querySelector("medi-excellent-list") as HTMLElement & {
            items?: ExcellentItem[];
        };
        excellent.items = this.excellentItems;
    }
}

customElements.define('home-page', HomePage);

/**
 * 接口返回空数组时也使用本地默认数据，避免首页出现空白区域。
 */
function withFallback<T>(value: T[] | undefined, fallback: T[]): T[] {
    return value && value.length > 0 ? value : fallback;
}
