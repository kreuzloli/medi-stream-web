import QRCode from "qrcode";
import logoUrl from "../../assets/images/logo_v2.jpg";

import {
    fetchWechatLoginStatus,
    fetchWechatQrCode,
} from "../../services/wechat-login";
import {
    getWechatLoginStatusPresentation,
    type WechatLoginStatus,
} from "../../services/wechat-login-normalizers";
import { defineElement, escapeHtml } from "../../utils/utils";

const POLL_INTERVAL_MS = 2_000;

type DialogViewState = "idle" | "loading" | "ready" | "expired" | "error";

/**
 * 微信扫码登录弹窗。
 *
 * 组件独立管理二维码创建、浏览器本地绘制、状态轮询和关闭时的资源清理，
 * Header 只需要调用 open()，不感知具体登录流程。
 */
export class WechatLoginDialog extends HTMLElement {
    private isOpen = false;
    private viewState: DialogViewState = "idle";
    private loginStatus: WechatLoginStatus = "WAITING";
    private sessionId = "";
    private qrUrl = "";
    private errorMessage = "";
    private pollTimer: number | undefined;
    private activeRequest: AbortController | undefined;
    private requestVersion = 0;

    connectedCallback(): void {
        this.render();
    }

    disconnectedCallback(): void {
        this.stopAsyncWork("component-disconnected");
        window.removeEventListener("keydown", this.handleKeydown);
        document.body.classList.remove("wechat-login-open");
    }

    /**
     * 打开弹窗并创建新的二维码会话；重复调用不会启动第二套轮询。
     */
    open(): void {
        if (this.isOpen) {
            return;
        }

        this.isOpen = true;
        this.resetViewState();
        document.body.classList.add("wechat-login-open");
        window.addEventListener("keydown", this.handleKeydown);
        console.info("[wechat-login-dialog] opened");
        this.render();
        void this.loadQrCode();
    }

    /**
     * 关闭弹窗并停止轮询，防止组件不可见时继续请求状态接口。
     */
    close(reason = "user-close"): void {
        if (!this.isOpen) {
            return;
        }

        this.isOpen = false;
        this.stopAsyncWork(reason);
        window.removeEventListener("keydown", this.handleKeydown);
        document.body.classList.remove("wechat-login-open");
        console.info("[wechat-login-dialog] closed", { reason });
        this.render();
    }

    private readonly handleKeydown = (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
            this.close("escape-key");
        }
    };

    /**
     * 请求新的二维码并在 Canvas 中绘制完整 OAuth 地址。
     */
    private async loadQrCode(): Promise<void> {
        const version = this.beginRequestCycle();
        this.viewState = "loading";
        this.errorMessage = "";
        this.render();

        try {
            const result = await fetchWechatQrCode(this.activeRequest?.signal);

            if (!this.isCurrentVersion(version)) {
                return;
            }

            this.sessionId = result.sessionId;
            this.qrUrl = result.qrUrl;
            this.loginStatus = "WAITING";
            this.viewState = "ready";
            this.render();
            await this.drawQrCode(version);

            if (!this.isCurrentVersion(version)) {
                return;
            }

            console.info("[wechat-login-dialog] qrcode ready", {
                hasSession: Boolean(this.sessionId),
            });
            this.schedulePoll(version);
        } catch (error) {
            if (this.isAbortError(error) || !this.isCurrentVersion(version)) {
                return;
            }

            this.showError(error, "二维码加载失败，请稍后重试");
        }
    }

    /**
     * 将二维码 URL 编码到本地 Canvas，不把登录会话发送给第三方二维码服务。
     */
    private async drawQrCode(version: number): Promise<void> {
        const canvas = this.querySelector<HTMLCanvasElement>("[data-wechat-qrcode-canvas]");

        if (!canvas || !this.qrUrl) {
            throw new Error("二维码画布尚未准备好");
        }

        await QRCode.toCanvas(canvas, this.qrUrl, {
            width: 236,
            margin: 1,
            errorCorrectionLevel: "M",
            color: {
                dark: "#172554",
                light: "#ffffff",
            },
        });

        if (!this.isCurrentVersion(version)) {
            return;
        }

        canvas.setAttribute("aria-label", "微信扫码登录二维码");
    }

    /**
     * 单次查询当前会话状态；请求完成后再安排下一次轮询，避免请求堆叠。
     */
    private async pollStatus(version: number): Promise<void> {
        if (!this.isCurrentVersion(version) || !this.sessionId) {
            return;
        }

        this.activeRequest = new AbortController();

        try {
            const result = await fetchWechatLoginStatus(this.sessionId, this.activeRequest.signal);

            if (!this.isCurrentVersion(version)) {
                return;
            }

            const previousStatus = this.loginStatus;
            this.loginStatus = result.status;
            const presentation = getWechatLoginStatusPresentation(result.status);

            if (previousStatus !== result.status) {
                console.info("[wechat-login-dialog] status changed", {
                    from: previousStatus,
                    to: result.status,
                });
                this.viewState = result.status === "EXPIRED" ? "expired" : "ready";
                this.render();

                if (this.viewState === "ready") {
                    await this.drawQrCode(version);
                }
            }

            if (presentation.terminal) {
                this.clearPollTimer();
                console.info("[wechat-login-dialog] polling stopped", {
                    reason: result.status.toLowerCase(),
                });
                return;
            }

            this.schedulePoll(version);
        } catch (error) {
            if (this.isAbortError(error) || !this.isCurrentVersion(version)) {
                return;
            }

            this.showError(error, "登录状态查询失败，请重新加载二维码");
        }
    }

    private schedulePoll(version: number): void {
        this.clearPollTimer();
        this.pollTimer = window.setTimeout(() => {
            void this.pollStatus(version);
        }, POLL_INTERVAL_MS);
    }

    /**
     * 刷新二维码前废弃上一轮异步结果，旧请求即使晚到也不能覆盖新状态。
     */
    private refreshQrCode(): void {
        console.info("[wechat-login-dialog] refresh requested");
        this.stopAsyncWork("refresh");
        this.resetViewState();
        void this.loadQrCode();
    }

    private beginRequestCycle(): number {
        this.stopAsyncWork("new-request-cycle");
        this.requestVersion += 1;
        this.activeRequest = new AbortController();
        return this.requestVersion;
    }

    private stopAsyncWork(reason: string): void {
        this.clearPollTimer();
        this.activeRequest?.abort();
        this.activeRequest = undefined;
        this.requestVersion += 1;
        console.debug("[wechat-login-dialog] async work stopped", { reason });
    }

    private clearPollTimer(): void {
        if (this.pollTimer !== undefined) {
            window.clearTimeout(this.pollTimer);
            this.pollTimer = undefined;
        }
    }

    private resetViewState(): void {
        this.viewState = "idle";
        this.loginStatus = "WAITING";
        this.sessionId = "";
        this.qrUrl = "";
        this.errorMessage = "";
    }

    private showError(error: unknown, fallbackMessage: string): void {
        this.viewState = "error";
        this.errorMessage = error instanceof Error ? error.message : fallbackMessage;
        this.clearPollTimer();
        console.warn("[wechat-login-dialog] request failed", {
            message: this.errorMessage,
        });
        this.render();
    }

    private isCurrentVersion(version: number): boolean {
        return this.isOpen && version === this.requestVersion;
    }

    private isAbortError(error: unknown): boolean {
        return error instanceof DOMException && error.name === "AbortError";
    }

    /**
     * 渲染当前弹窗状态，并在每次模板替换后重新绑定局部按钮事件。
     */
    private render(): void {
        if (!this.isOpen) {
            this.innerHTML = "";
            return;
        }

        const presentation = getWechatLoginStatusPresentation(this.loginStatus);
        const showQrCode = this.viewState === "ready";
        const showRetry = this.viewState === "expired" || this.viewState === "error";

        this.innerHTML = `
            <div class="wechat-login-overlay" data-wechat-login-overlay>
                <section
                    class="wechat-login-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="wechat-login-title"
                    aria-describedby="wechat-login-description"
                >
                    <button
                        class="wechat-login-close"
                        type="button"
                        data-wechat-login-close
                        aria-label="关闭微信扫码登录"
                        title="关闭"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18"></path>
                        </svg>
                    </button>

                    <header class="wechat-login-heading">
                        <img class="wechat-login-brand-logo" src="${escapeHtml(logoUrl)}" alt="Genwhole">
                        <div>
                            <h2 id="wechat-login-title">微信扫码登录</h2>
                            <p id="wechat-login-description">安全连接微信身份，登录或继续完成注册</p>
                        </div>
                    </header>

                    <div class="wechat-login-content">
                        ${this.renderQrArea(showQrCode)}

                        <div class="wechat-login-status wechat-login-status--${this.statusTone()}" role="status" aria-live="polite">
                            <span class="wechat-login-status-dot" aria-hidden="true"></span>
                            <div>
                                <strong>${escapeHtml(this.statusLabel(presentation.label))}</strong>
                                <p>${escapeHtml(this.statusDescription(presentation.description))}</p>
                            </div>
                        </div>

                        ${showRetry ? `
                            <button class="wechat-login-refresh" type="button" data-wechat-login-refresh>
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M20 11a8 8 0 10-2.34 5.66M20 5v6h-6"></path>
                                </svg>
                                刷新二维码
                            </button>
                        ` : ""}

                        <p class="wechat-login-note">
                            二维码 5 分钟内有效，请使用微信扫一扫，不要在电脑浏览器中直接打开链接。
                        </p>
                    </div>
                </section>
            </div>
        `;

        this.bindActions();
        this.querySelector<HTMLButtonElement>("[data-wechat-login-close]")?.focus();
    }

    private renderQrArea(showQrCode: boolean): string {
        if (showQrCode) {
            return `
                <div class="wechat-login-qr-frame">
                    <div class="wechat-login-corner wechat-login-corner--top-left"></div>
                    <div class="wechat-login-corner wechat-login-corner--top-right"></div>
                    <div class="wechat-login-corner wechat-login-corner--bottom-left"></div>
                    <div class="wechat-login-corner wechat-login-corner--bottom-right"></div>
                    <canvas data-wechat-qrcode-canvas></canvas>
                </div>
            `;
        }

        if (this.viewState === "loading" || this.viewState === "idle") {
            return `
                <div class="wechat-login-qr-frame wechat-login-qr-frame--loading" aria-hidden="true">
                    <span class="wechat-login-spinner"></span>
                </div>
            `;
        }

        return `
            <div class="wechat-login-qr-frame wechat-login-qr-frame--unavailable" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                    <path d="M12 8v5M12 17h.01M10.3 3.6L2.5 17.1A2 2 0 004.2 20h15.6a2 2 0 001.7-2.9L13.7 3.6a2 2 0 00-3.4 0z"></path>
                </svg>
            </div>
        `;
    }

    private statusTone(): string {
        if (this.viewState === "loading" || this.viewState === "idle") {
            return "pending";
        }
        if (this.viewState === "error") {
            return "danger";
        }
        return getWechatLoginStatusPresentation(this.loginStatus).tone;
    }

    private statusLabel(defaultLabel: string): string {
        if (this.viewState === "loading" || this.viewState === "idle") {
            return "正在生成二维码";
        }
        if (this.viewState === "error") {
            return "暂时无法加载";
        }
        return defaultLabel;
    }

    private statusDescription(defaultDescription: string): string {
        if (this.viewState === "loading" || this.viewState === "idle") {
            return "正在建立安全的微信登录会话";
        }
        if (this.viewState === "error") {
            return this.errorMessage || "二维码加载失败，请稍后重试";
        }
        return defaultDescription;
    }

    private bindActions(): void {
        this.querySelector("[data-wechat-login-close]")?.addEventListener("click", () => {
            this.close("close-button");
        });
        this.querySelector("[data-wechat-login-refresh]")?.addEventListener("click", () => {
            this.refreshQrCode();
        });
        this.querySelector("[data-wechat-login-overlay]")?.addEventListener("click", (event) => {
            if (event.target === event.currentTarget) {
                this.close("backdrop");
            }
        });
    }
}

defineElement("wechat-login-dialog", WechatLoginDialog);
