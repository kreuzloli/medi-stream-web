import "./styles/global.css";
import "./components/bannerCarousel/banner-carousel";
import "./components/category/category-list";
import "./components/choiceness/choiceness-list";
import "./components/excellent/excellent-list";
import "./components/footer/footer";
import "./components/header/header";
import "./components/live/live-list";

import { startRouter } from './router';
import { homeChoicenessItems, homeLiveItems } from "./data";
import type { CategoryItem } from "./models/models";
import { fetchCatalogCategories } from "./services/catalog";
import { defineElement, escapeHtml } from "./utils/utils";

startRouter();
// Vite + Vanilla TypeScript + Web Components
class MediApp extends HTMLElement {
    private categories: CategoryItem[] | undefined;
    private loading = false;
    private error: string | null = null;

    connectedCallback(): void {
        this.render();
        void this.loadCategories();
    }

    private async loadCategories(): Promise<void> {
        this.loading = true;
        this.error = null;
        this.render();

        try {
            this.categories = await fetchCatalogCategories();
        } catch (error) {
            this.categories = undefined;
            this.error = error instanceof Error ? error.message : "目录接口未连接，已显示默认分类";
        } finally {
            this.loading = false;
            this.render();
        }
    }

    private render(): void {
        this.innerHTML = `
            <div class="App">
                <medi-header></medi-header>
                <div class="app-home">
                    <aside class="app-left">
                        <medi-category-list></medi-category-list>
                        ${this.loading ? `<div class="state-text">加载中...</div>` : ""}
                        ${this.error ? `<div class="state-text state-text-error">${escapeHtml(this.error)}</div>` : ""}
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

        const live = this.querySelector("medi-live-list") as HTMLElement & {
            items?: typeof homeLiveItems;
        };
        live.items = homeLiveItems;

        const choiceness = this.querySelector("medi-choiceness-list") as HTMLElement & {
            items?: typeof homeChoicenessItems;
        };
        choiceness.items = homeChoicenessItems;
    }
}

defineElement("medi-app", MediApp);
