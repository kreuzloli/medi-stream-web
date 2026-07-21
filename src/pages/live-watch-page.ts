import "../components/header/header";
import "../components/player/live-player";
import type { LivePlayerComponent } from "../components/player/live-player";
import { getHashQueryParam } from "../router";
import { getToken } from "../services/auth";
import { fetchLiveWatch, type LiveWatchInfo } from "../services/live-watch";
import { currentReturnPath } from "../services/return-path";
import { defineElement, escapeHtml } from "../utils/utils";
import { renderLiveWatchReservations } from "./live-watch-reservations";

type PageState = "login-required" | "missing-room" | "loading" | "ready" | "error";

/** 通过 roomCode 直接进入的登录用户直播观看页。 */
export class LiveWatchPage extends HTMLElement {
    private state: PageState = "loading";
    private info: LiveWatchInfo | null = null;
    private errorMessage = "";

    connectedCallback(): void {
        const roomCode = getHashQueryParam("roomCode")?.trim() || "";
        console.info("[live-watch-page] connected", {
            roomCode,
            authenticated: Boolean(getToken()),
        });
        if (!getToken()) {
            this.state = "login-required";
            this.render();
            return;
        }
        if (!roomCode) {
            this.state = "missing-room";
            this.render();
            return;
        }
        this.state = "loading";
        this.render();
        void this.load(roomCode);
    }

    private async load(roomCode: string): Promise<void> {
        try {
            this.info = await fetchLiveWatch(roomCode);
            this.state = "ready";
            this.render();
            await this.startPlayback();
        } catch (error) {
            this.state = "error";
            this.errorMessage = error instanceof Error ? error.message : "直播间加载失败";
            console.error("[live-watch-page] load failed", {
                roomCode,
                message: this.errorMessage,
            });
            this.render();
        }
    }

    private async startPlayback(): Promise<void> {
        const player = this.querySelector<LivePlayerComponent>("live-player");
        const playUrl = this.info?.urls.playWebrtc || this.info?.urls.playFlv || this.info?.urls.playHls;
        if (!player || !playUrl) return;
        try {
            await player.play(playUrl);
        } catch (error) {
            console.warn("[live-watch-page] automatic playback blocked", {
                message: error instanceof Error ? error.message : String(error),
            });
            this.updateStatus("浏览器已阻止自动播放，请点击“开始播放”", true);
        }
    }

    private render(): void {
        this.innerHTML = `<div class="live-watch-page"><medi-header></medi-header>${this.renderContent()}</div>`;
        this.bindEvents();
    }

    private renderContent(): string {
        if (this.state === "login-required") {
            return this.renderState("仅限登录用户观看", "请先使用微信扫码登录，登录后会自动返回当前直播间。", true);
        }
        if (this.state === "missing-room") {
            return this.renderState("缺少直播房间号", "请使用 #/live-watch?roomCode=房间号 访问直播间。", false);
        }
        if (this.state === "loading") {
            return `<main class="live-watch-state"><span class="live-watch-loader"></span><h1>正在进入直播间</h1><p>正在校验登录状态并获取播放地址…</p></main>`;
        }
        if (this.state === "error") {
            return this.renderState("暂时无法进入直播间", this.errorMessage, false);
        }
        const info = this.info!;
        return `<main class="live-watch-shell">
            <header class="live-watch-heading">
                <div><span class="live-watch-live-dot"></span><span>LIVE ROOM</span></div>
                <h1>${escapeHtml(info.room.title)}</h1>
                <p>${escapeHtml(info.room.description || "专业医学直播内容")}</p>
            </header>
            <div class="live-watch-content-grid">
                <section class="live-watch-player-card">
                    <live-player></live-player>
                    <div class="live-watch-toolbar">
                        <div><strong>${escapeHtml(info.stream.title || info.stream.streamName)}</strong><span>房间号 ${escapeHtml(info.room.roomCode)}</span></div>
                        <button type="button" data-play-live>开始播放</button>
                    </div>
                    <p class="live-watch-status" data-live-status>正在连接直播流…</p>
                </section>
                ${renderLiveWatchReservations()}
            </div>
        </main>`;
    }

    private renderState(title: string, description: string, login: boolean): string {
        return `<main class="live-watch-state"><div class="live-watch-state-mark">${login ? "身份验证" : "直播间"}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${login ? `<button type="button" data-watch-login>微信扫码登录</button>` : `<a href="#/">返回首页</a>`}</main>`;
    }

    private bindEvents(): void {
        this.querySelector("[data-watch-login]")?.addEventListener("click", () => {
            const header = this.querySelector("medi-header");
            const dialog = header?.querySelector<HTMLElement & { open: (returnTo?: string) => void }>("wechat-login-dialog");
            console.info("[live-watch-page] login requested", { returnTo: currentReturnPath() });
            dialog?.open(currentReturnPath());
        });
        this.querySelector("[data-play-live]")?.addEventListener("click", () => void this.startPlayback());
        this.querySelector("live-player")?.addEventListener("live-player-status", event => {
            const detail = (event as CustomEvent<{ message: string; type: string }>).detail;
            this.updateStatus(detail.message, detail.type === "error");
        });
    }

    private updateStatus(message: string, error: boolean): void {
        const status = this.querySelector<HTMLElement>("[data-live-status]");
        if (!status) return;
        status.textContent = message;
        status.classList.toggle("live-watch-status--error", error);
    }
}

defineElement("live-watch-page", LiveWatchPage);
