import "../../components/player/live-player";
import type { LivePlayerComponent } from "../../components/player/live-player";
import { clearToken, getToken } from "../../services/auth";
import { handleTokenFromHashUrl, redirectToOAuth } from "../../services/oauth";
import { buildWechatOAuthUrl } from "../../services/wechat";

type LivePlayerStatus = {
    message: string;
    type: "normal" | "success" | "error";
};

export class WechatLivePage extends HTMLElement {
    /**
     * Web Component 挂载到页面时执行。
     *
     * 页面初始化流程：
     * 1. 先从 URL 读取后端回传的 token。
     * 2. 如果没有本地 token，则跳转微信 OAuth。
     * 3. 如果有 token，则渲染直播页面。
     */
    connectedCallback() {
        console.info("[wechat-live] page connected");

        handleTokenFromHashUrl("/wechat-live-play");

        const token = getToken();

        if (!token) {
            console.info("[wechat-live] token not found, redirect to wechat oauth");

            redirectToOAuth(buildWechatOAuthUrl("/wechat-live-play"));
            return;
        }

        console.info("[wechat-live] token exists, render live page");

        this.render();
        this.bindEvents();
    }

    /**
     * 绑定页面按钮和播放器事件。
     */
    private bindEvents() {
        const livePlayer = this.querySelector<LivePlayerComponent>("live-player");
        const inputElement = this.querySelector<HTMLInputElement>("#live-url-input");
        const playButton = this.querySelector<HTMLButtonElement>("#play-button");
        const logoutButton = this.querySelector<HTMLButtonElement>("#logout-button");
        const statusElement = this.querySelector<HTMLParagraphElement>("#live-status");

        if (!livePlayer || !inputElement || !playButton || !logoutButton || !statusElement) {
            console.warn("[wechat-live] bind events failed, element missing");
            return;
        }

        playButton.addEventListener("click", () => {
            const liveUrl = inputElement.value.trim();

            console.info("[wechat-live] play button clicked", {
                hasLiveUrl: Boolean(liveUrl),
            });

            if (!liveUrl) {
                this.updateStatus(statusElement, {
                    message: "请输入直播播放地址",
                    type: "error",
                });
                return;
            }

            livePlayer.play(liveUrl);
        });

        logoutButton.addEventListener("click", () => {
            console.info("[wechat-live] clear token and re-auth");

            clearToken();
            redirectToOAuth(buildWechatOAuthUrl("/wechat-live-play"));
        });

        livePlayer.addEventListener("live-player-status", (event) => {
            const customEvent = event as CustomEvent<LivePlayerStatus>;

            console.info("[wechat-live] live player status", customEvent.detail);

            this.updateStatus(statusElement, customEvent.detail);
        });
    }

    /**
     * 更新页面上的播放状态文案。
     */
    private updateStatus(statusElement: HTMLParagraphElement, status: LivePlayerStatus) {
        statusElement.textContent = status.message;

        if (status.type === "error") {
            statusElement.className = "live-status live-status-error";
            return;
        }

        if (status.type === "success") {
            statusElement.className = "live-status live-status-success";
            return;
        }

        statusElement.className = "live-status";
    }

    /**
     * 渲染微信 H5 直播页面。
     */
    private render() {
        this.innerHTML = `
            <style>
                .wechat-live-page {
                    min-height: 100vh;
                    box-sizing: border-box;
                    background: #f6f7fb;
                    padding: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                .live-card {
                    width: 100%;
                    max-width: 480px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 18px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
                }

                .live-header {
                    padding: 16px;
                    border-bottom: 1px solid #eef0f4;
                }

                .live-title {
                    margin: 0;
                    font-size: 20px;
                    color: #111827;
                }

                .live-desc {
                    margin: 6px 0 0;
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 1.5;
                }

                .live-form {
                    padding: 16px;
                }

                .live-label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #374151;
                }

                .live-input {
                    width: 100%;
                    height: 44px;
                    box-sizing: border-box;
                    padding: 0 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 12px;
                    font-size: 14px;
                    outline: none;
                }

                .live-input:focus {
                    border-color: #07c160;
                }

                .live-actions {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 10px;
                    margin-top: 14px;
                }

                .live-button {
                    height: 44px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 600;
                }

                .live-button-primary {
                    color: #ffffff;
                    background: #07c160;
                }

                .live-button-secondary {
                    color: #374151;
                    background: #eef0f4;
                }

                .live-status {
                    margin: 12px 0 0;
                    font-size: 13px;
                    color: #6b7280;
                    word-break: break-all;
                    line-height: 1.5;
                }

                .live-status-error {
                    color: #dc2626;
                }

                .live-status-success {
                    color: #16a34a;
                }
            </style>

            <main class="wechat-live-page">
                <section class="live-card">
                    <div class="live-header">
                        <h1 class="live-title">直播间</h1>
                        <p class="live-desc">
                            微信公众号 H5 直播页面。未登录时会自动跳转微信授权，授权后回到这里播放直播。
                        </p>
                    </div>

                    <live-player></live-player>

                    <div class="live-form">
                        <label class="live-label" for="live-url-input">
                            直播播放地址
                        </label>

                        <input
                            id="live-url-input"
                            class="live-input"
                            placeholder="请输入 webrtc://、flv 或 m3u8 地址"
                        />

                        <div class="live-actions">
                            <button id="play-button" class="live-button live-button-primary">
                                进入直播
                            </button>

                            <button id="logout-button" class="live-button live-button-secondary">
                                清除登录并重新授权
                            </button>
                        </div>

                        <p id="live-status" class="live-status">
                            已进入微信 H5 直播页，等待播放地址
                        </p>
                    </div>
                </section>
            </main>
        `;
    }
}

customElements.define("wechat-live-page", WechatLivePage);
