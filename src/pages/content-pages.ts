import { fallbackCertificate, fallbackTopics, fallbackTrainingDetail, fallbackTrainings } from "../content-data";
import { defaultBanners, homeLiveItems, schematicUrl } from "../data";
import type { Banner, CertificateDetail, LiveItem, TopicItem, TrainingDetail, TrainingItem } from "../models/models";
import { getHashQueryParam, navigateTo } from "../router";
import { fetchBanners } from "../services/banner";
import {
    fetchCertificateDetail,
    fetchLives,
    fetchTopics,
    fetchTrainingDetail,
    fetchTrainings,
    queryCertificate,
} from "../services/content";
import { ContentNetworkError } from "../services/content-errors";
import { validateCertificateQuery } from "../services/content-normalizers";
import { defineElement, escapeHtml } from "../utils/utils";
import { safeUrl } from "../utils/safe-url";

abstract class ContentPage extends HTMLElement {
    protected banners: Banner[] = defaultBanners;

    /**
     * 内容页共享轮播加载逻辑。接口暂不可用时保留页面可用性，并记录具体栏目。
     */
    protected async loadBanners(placement: string): Promise<void> {
        try {
            const banners = await fetchBanners(placement);
            this.banners = banners.length > 0 ? banners : defaultBanners;
        } catch (error) {
            this.banners = defaultBanners;
            console.warn("[content-page] use fallback banners", {
                placement,
                message: error instanceof Error ? error.message : String(error),
            });
        }

        this.render();
    }

    protected shell(title: string, content: string, action = ""): string {
        return `
            <div class="App content-app">
                <medi-header></medi-header>
                <main class="content-main">
                    <div class="content-banner"><medi-banner-carousel></medi-banner-carousel></div>
                    <div class="content-title-row">
                        <h1 class="content-title">${escapeHtml(title)}</h1>
                        ${action}
                    </div>
                    ${content}
                </main>
                <medi-footer></medi-footer>
            </div>
        `;
    }

    protected applyBanners(): void {
        const banner = this.querySelector("medi-banner-carousel") as HTMLElement & { banners?: Banner[] };
        banner.banners = this.banners;
    }

    protected abstract render(): void;
}

class TopicsPage extends ContentPage {
    private topics: TopicItem[] = fallbackTopics;
    private loading = true;

    connectedCallback(): void {
        this.render();
        void this.loadTopics();
        void this.loadBanners("topics");
    }

    private async loadTopics(): Promise<void> {
        try {
            const topics = await fetchTopics();
            this.topics = topics.length > 0 ? topics : fallbackTopics;
        } catch (error) {
            this.topics = fallbackTopics;
            console.warn("[topics-page] use fallback topics", {
                message: error instanceof Error ? error.message : String(error),
            });
        } finally {
            this.loading = false;
            this.render();
        }
    }

    protected render(): void {
        const cards = this.topics.map((topic) => `
            <article class="topic-card">
                <img class="topic-card__cover" src="${escapeHtml(safeUrl(topic.cover) || schematicUrl)}" alt="">
                <div class="topic-card__body">
                    <h2>${escapeHtml(topic.title)}</h2>
                </div>
            </article>
        `).join("");

        this.innerHTML = this.shell(
            "精选专题",
            `${this.loading ? '<div class="state-text">加载中...</div>' : ""}<section class="topic-grid">${cards}</section>`,
        );
        this.applyBanners();
        this.querySelectorAll<HTMLElement>(".topic-card").forEach((card) => {
            card.tabIndex = 0;
            card.setAttribute("role", "link");
            const openTopic = () => navigateTo("/topics");
            card.addEventListener("click", openTopic);
            card.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openTopic();
                }
            });
        });
    }
}

class LiveListPage extends ContentPage {
    private lives: LiveItem[] = homeLiveItems;
    private loading = true;

    connectedCallback(): void {
        this.render();
        void this.loadLives();
        void this.loadBanners("live-list");
    }

    private async loadLives(): Promise<void> {
        try {
            const lives = await fetchLives();
            this.lives = lives.length > 0 ? lives : homeLiveItems;
        } catch (error) {
            this.lives = homeLiveItems;
            console.warn("[live-list-page] use fallback lives", {
                message: error instanceof Error ? error.message : String(error),
            });
        } finally {
            this.loading = false;
            this.render();
        }
    }

    protected render(): void {
        this.innerHTML = this.shell(
            "近期直播",
            `${this.loading ? '<div class="state-text">加载中...</div>' : ""}<medi-live-list></medi-live-list>`,
        );
        this.applyBanners();
        const list = this.querySelector("medi-live-list") as HTMLElement & { items?: LiveItem[] };
        list.items = this.lives;
    }
}

class TrainingListPage extends ContentPage {
    private trainings: TrainingItem[] = fallbackTrainings;
    private loading = true;

    connectedCallback(): void {
        this.render();
        void this.loadTrainings();
        void this.loadBanners("training");
    }

    private async loadTrainings(): Promise<void> {
        try {
            const trainings = await fetchTrainings();
            this.trainings = trainings.length > 0 ? trainings : fallbackTrainings;
        } catch (error) {
            this.trainings = fallbackTrainings;
            console.warn("[training-list] use fallback trainings", {
                message: error instanceof Error ? error.message : String(error),
            });
        } finally {
            this.loading = false;
            this.render();
        }
    }

    protected render(): void {
        const rows = this.trainings.map((training) => `
            <article class="training-row">
                <img src="${escapeHtml(safeUrl(training.cover) || schematicUrl)}" alt="">
                <div class="training-row__content">
                    <h2>${escapeHtml(training.title)}</h2>
                    <p>◷ ${escapeHtml(training.date)}</p>
                </div>
                <button type="button" data-training-id="${escapeHtml(training.id)}">查看详情</button>
            </article>
        `).join("");

        this.innerHTML = this.shell(
            "科研培训",
            `${this.loading ? '<div class="state-text">加载中...</div>' : ""}<section class="training-list">${rows}</section>`,
            certificateAction(),
        );
        this.applyBanners();
        this.bindCommonActions();
        this.querySelectorAll<HTMLButtonElement>("[data-training-id]").forEach((button) => {
            button.addEventListener("click", () => navigateTo(`/training-detail?id=${button.dataset.trainingId}`));
        });
    }

    private bindCommonActions(): void {
        this.querySelector("[data-certificate-link]")?.addEventListener("click", () => navigateTo("/certificates"));
    }
}

class TrainingDetailPage extends ContentPage {
    private detail: TrainingDetail = fallbackTrainingDetail;
    private loading = true;

    connectedCallback(): void {
        this.render();
        void this.loadDetail();
        void this.loadBanners("training-detail");
    }

    private async loadDetail(): Promise<void> {
        const id = getHashQueryParam("id") ?? fallbackTrainingDetail.id;
        try {
            this.detail = await fetchTrainingDetail(id);
        } catch (error) {
            this.detail = fallbackTrainingDetail;
            console.warn("[training-detail] use fallback detail", {
                trainingId: id,
                message: error instanceof Error ? error.message : String(error),
            });
        } finally {
            this.loading = false;
            this.render();
        }
    }

    protected render(): void {
        const detail = this.detail;
        const article = `
            <article class="training-article">
                <header>
                    <h2>${escapeHtml(detail.title)}</h2>
                    <p>${escapeHtml(detail.date)}　 来源：${escapeHtml(detail.source)}</p>
                </header>
                ${detail.paragraphs.map((paragraph, index) => `
                    <p class="training-article__paragraph">${escapeHtml(paragraph)}</p>
                    ${index === 0 && detail.contentImage ? `
                        <figure>
                            <img src="${escapeHtml(safeUrl(detail.contentImage))}" alt="">
                            <figcaption>${escapeHtml(detail.imageCaption)}</figcaption>
                        </figure>
                    ` : ""}
                `).join("")}
                ${safeUrl(detail.relatedLink) ? `<a class="training-related" href="${escapeHtml(safeUrl(detail.relatedLink))}">${escapeHtml(detail.relatedLinkText)}</a>` : ""}
            </article>
        `;

        this.innerHTML = this.shell(
            "科研培训",
            `${this.loading ? '<div class="state-text">加载中...</div>' : ""}${article}`,
            certificateAction(),
        );
        this.applyBanners();
        this.querySelector("[data-certificate-link]")?.addEventListener("click", () => navigateTo("/certificates"));
    }
}

class CertificateQueryPage extends ContentPage {
    private submitting = false;
    private message = "";

    connectedCallback(): void {
        this.render();
        void this.loadBanners("certificates");
    }

    protected render(): void {
        this.innerHTML = this.shell("证书查询", `
            <section class="certificate-form-panel">
                <form class="certificate-form" novalidate>
                    <label><span>姓　　名：</span><input name="name" autocomplete="name"></label>
                    <label><span>身份证号码：</span><input name="idNumber" autocomplete="off"></label>
                    <label><span>手 机 号 码：</span><input name="phone" autocomplete="tel"></label>
                    <p class="certificate-message" role="status">${escapeHtml(this.message)}</p>
                    <button type="submit" ${this.submitting ? "disabled" : ""}>${this.submitting ? "查询中..." : "查询"}</button>
                </form>
            </section>
        `);
        this.applyBanners();
        const form = this.querySelector<HTMLFormElement>(".certificate-form");
        form?.addEventListener("submit", (event) => {
            event.preventDefault();
            void this.submit(form);
        });
    }

    private async submit(form: HTMLFormElement): Promise<void> {
        const formData = new FormData(form);
        const query = {
            name: String(formData.get("name") ?? ""),
            idNumber: String(formData.get("idNumber") ?? ""),
            phone: String(formData.get("phone") ?? ""),
        };
        const validationMessage = validateCertificateQuery(query);

        if (validationMessage) {
            this.message = validationMessage;
            this.render();
            return;
        }

        this.submitting = true;
        this.message = "";
        this.render();

        try {
            const result = await queryCertificate(query);
            navigateTo(`/certificate-detail?id=${encodeURIComponent(result.certificateId)}`);
        } catch (error) {
            const canUseFallback = error instanceof ContentNetworkError;
            console.warn("[certificate-query] query failed", {
                name: query.name,
                useFallback: canUseFallback,
                message: error instanceof Error ? error.message : String(error),
            });

            if (canUseFallback) {
                navigateTo(`/certificate-detail?id=${fallbackCertificate.id}&demo=1`);
                return;
            }

            this.submitting = false;
            this.message = error instanceof Error ? error.message : "证书查询失败，请稍后重试";
            this.render();
        }
    }
}

class CertificateDetailPage extends ContentPage {
    private detail: CertificateDetail | null = null;
    private loading = true;
    private errorMessage = "";
    private demo = false;

    connectedCallback(): void {
        this.render();
        void this.loadDetail();
        void this.loadBanners("certificate-detail");
    }

    private async loadDetail(): Promise<void> {
        const id = getHashQueryParam("id");
        if (!id) {
            this.loading = false;
            this.errorMessage = "缺少证书编号，请返回证书查询页面重新查询";
            this.render();
            return;
        }

        if (getHashQueryParam("demo") === "1") {
            this.detail = fallbackCertificate;
            this.demo = true;
            this.loading = false;
            this.render();
            return;
        }
        try {
            this.detail = await fetchCertificateDetail(id);
        } catch (error) {
            console.warn("[certificate-detail] load failed", {
                certificateId: id,
                message: error instanceof Error ? error.message : String(error),
            });
            this.loading = false;
            this.errorMessage = error instanceof Error ? error.message : "证书详情加载失败，请稍后重试";
            this.render();
            return;
        } finally {
            this.loading = false;
        }

        this.render();
    }

    protected render(): void {
        const detail = this.detail;
        if (this.loading) {
            this.innerHTML = this.shell("证书查询", '<div class="content-loading">证书信息加载中...</div>');
            this.applyBanners();
            return;
        }

        if (this.errorMessage || !detail) {
            const message = this.errorMessage || "未查询到证书信息";
            this.innerHTML = this.shell("证书查询", `<div class="content-error" role="alert">${escapeHtml(message)}</div>`);
            this.applyBanners();
            return;
        }

        const row = (label: string, value: string) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
        const table = `
            <section class="certificate-result">
                ${this.demo ? '<div class="demo-data-notice">当前为接口未连接时的演示数据</div>' : ""}
                <h2>查询结果</h2>
                <table>
                    <caption>基础信息</caption>
                    <tbody>
                        ${row("姓名", detail.name)}
                        ${row("性别", detail.gender)}
                        ${row("身份证号", detail.idNumber)}
                        <tr class="certificate-section"><th colspan="2">证书信息</th></tr>
                        ${row("证书名称", detail.certificateName)}
                        ${row("证书编号", detail.certificateNumber)}
                        ${row("发证日期", detail.issueDate)}
                        ${row("级别", detail.level)}
                    </tbody>
                </table>
            </section>
        `;

        this.innerHTML = this.shell("证书查询", table);
        this.applyBanners();
    }
}

function certificateAction(): string {
    return '<button class="content-action" type="button" data-certificate-link>证书查询　›</button>';
}

defineElement("topics-page", TopicsPage);
defineElement("live-list-page", LiveListPage);
defineElement("training-list-page", TrainingListPage);
defineElement("training-detail-page", TrainingDetailPage);
defineElement("certificate-query-page", CertificateQueryPage);
defineElement("certificate-detail-page", CertificateDetailPage);
