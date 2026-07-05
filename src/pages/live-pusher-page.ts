import '../components/header/header';
import '../components/pusher/live-pusher';
import type { LivePusherComponent } from '../components/pusher/live-pusher';
import { escapeHtml } from '../utils/utils';

type LivePusherStatus = {
    message: string;
    type: 'normal' | 'success' | 'error';
};

type CaptureMode = 'camera' | 'screen';

class LivePusherPage extends HTMLElement {
    private status: LivePusherStatus = {
        message: '等待初始化推流器',
        type: 'normal',
    };

    private statisticsText = '暂无推流统计';

    connectedCallback(): void {
        this.render();
        this.bindEvents();
    }

    private bindEvents(): void {
        const pusher = this.querySelector<LivePusherComponent>('live-pusher');
        const pushUrlInput = this.querySelector<HTMLInputElement>('#push-url-input');
        const videoQualitySelect = this.querySelector<HTMLSelectElement>('#video-quality-select');
        const audioQualitySelect = this.querySelector<HTMLSelectElement>('#audio-quality-select');
        const captureModeSelect = this.querySelector<HTMLSelectElement>('#capture-mode-select');

        const checkButton = this.querySelector<HTMLButtonElement>('#check-support-button');
        const previewButton = this.querySelector<HTMLButtonElement>('#start-preview-button');
        const stopPreviewButton = this.querySelector<HTMLButtonElement>('#stop-preview-button');
        const pushButton = this.querySelector<HTMLButtonElement>('#start-push-button');
        const stopPushButton = this.querySelector<HTMLButtonElement>('#stop-push-button');

        const muteVideoButton = this.querySelector<HTMLButtonElement>('#mute-video-button');
        const resumeVideoButton = this.querySelector<HTMLButtonElement>('#resume-video-button');
        const muteAudioButton = this.querySelector<HTMLButtonElement>('#mute-audio-button');
        const resumeAudioButton = this.querySelector<HTMLButtonElement>('#resume-audio-button');

        if (
            !pusher ||
            !pushUrlInput ||
            !videoQualitySelect ||
            !audioQualitySelect ||
            !captureModeSelect ||
            !checkButton ||
            !previewButton ||
            !stopPreviewButton ||
            !pushButton ||
            !stopPushButton ||
            !muteVideoButton ||
            !resumeVideoButton ||
            !muteAudioButton ||
            !resumeAudioButton
        ) {
            return;
        }

        checkButton.addEventListener('click', () => {
            void pusher.checkSupport();
        });

        previewButton.addEventListener('click', () => {
            const videoQuality = videoQualitySelect.value;
            const audioQuality = audioQualitySelect.value;
            const captureMode = captureModeSelect.value as CaptureMode;

            void pusher.startPreview({
                videoQuality,
                audioQuality,
                captureMode,
            });
        });

        stopPreviewButton.addEventListener('click', () => {
            pusher.stopPreview();
        });

        pushButton.addEventListener('click', () => {
            const pushUrl = pushUrlInput.value.trim();

            if (!pushUrl) {
                this.updateStatus({
                    message: '请输入 WebRTC 推流地址',
                    type: 'error',
                });
                return;
            }

            if (!pushUrl.startsWith('webrtc://')) {
                this.updateStatus({
                    message: 'Web 在线推流只支持 webrtc:// 推流地址',
                    type: 'error',
                });
                return;
            }

            void pusher.startPush(pushUrl);
        });

        stopPushButton.addEventListener('click', () => {
            pusher.stopPush();
        });

        muteVideoButton.addEventListener('click', () => {
            pusher.muteVideo();
        });

        resumeVideoButton.addEventListener('click', () => {
            pusher.resumeVideo();
        });

        muteAudioButton.addEventListener('click', () => {
            pusher.muteAudio();
        });

        resumeAudioButton.addEventListener('click', () => {
            pusher.resumeAudio();
        });

        pusher.addEventListener('live-pusher-status', (event) => {
            const customEvent = event as CustomEvent<LivePusherStatus>;

            this.updateStatus(customEvent.detail);
        });

        pusher.addEventListener('live-pusher-statistics', (event) => {
            const customEvent = event as CustomEvent<object>;

            this.statisticsText = JSON.stringify(customEvent.detail, null, 2);
            this.updateStatistics();
        });
    }

    private updateStatus(status: LivePusherStatus): void {
        this.status = status;

        const statusElement = this.querySelector<HTMLParagraphElement>('#push-status');

        if (!statusElement) {
            return;
        }

        statusElement.textContent = status.message;

        if (status.type === 'error') {
            statusElement.className = 'push-status push-status-error';
            return;
        }

        if (status.type === 'success') {
            statusElement.className = 'push-status push-status-success';
            return;
        }

        statusElement.className = 'push-status';
    }

    private updateStatistics(): void {
        const statisticsElement = this.querySelector<HTMLPreElement>('#push-statistics');

        if (!statisticsElement) {
            return;
        }

        statisticsElement.textContent = this.statisticsText;
    }

    private render(): void {
        this.innerHTML = `
            <div class="App">
                <medi-header></medi-header>

                <main class="live-room-page">
                    <section class="live-room-shell">
                        <div class="live-room-hero">
                            <div>
                                <p class="eyebrow">WebRTC Live Pusher</p>
                                <h1>在线推流</h1>
                                <p class="hero-desc">
                                    使用腾讯云 Web 推流 SDK，浏览器采集摄像头 / 麦克风或屏幕，并通过 WebRTC 推送到云直播。
                                </p>
                            </div>

                            <div class="hero-badge">
                                <span class="badge-dot"></span>
                                Web 推流只支持 WebRTC
                            </div>
                        </div>

                        <div class="live-room-grid">
                            <section class="panel preview-panel">
                                <live-pusher></live-pusher>
                            </section>

                            <section class="panel control-panel">
                                <h2>推流控制</h2>

                                <label class="form-label" for="push-url-input">
                                    WebRTC 推流地址
                                </label>

                                <textarea
                                    id="push-url-input"
                                    class="push-textarea"
                                    placeholder="请输入 webrtc:// 推流地址，例如：webrtc://推流域名/live/streamName?txSecret=xxx&txTime=xxx"
                                ></textarea>

                                <div class="form-grid">
                                    <label class="form-field">
                                        <span>视频质量</span>
                                        <select id="video-quality-select">
                                            <option value="360p">360p</option>
                                            <option value="480p">480p</option>
                                            <option value="720p" selected>720p</option>
                                            <option value="1080p">1080p</option>
                                        </select>
                                    </label>

                                    <label class="form-field">
                                        <span>音频质量</span>
                                        <select id="audio-quality-select">
                                            <option value="standard" selected>standard</option>
                                            <option value="high">high</option>
                                        </select>
                                    </label>

                                    <label class="form-field">
                                        <span>采集模式</span>
                                        <select id="capture-mode-select">
                                            <option value="camera" selected>摄像头 + 麦克风</option>
                                            <option value="screen">屏幕分享</option>
                                        </select>
                                    </label>
                                </div>

                                <div class="button-grid">
                                    <button id="check-support-button" class="action-button ghost">
                                        检查支持
                                    </button>

                                    <button id="start-preview-button" class="action-button primary">
                                        开启预览
                                    </button>

                                    <button id="stop-preview-button" class="action-button ghost">
                                        关闭预览
                                    </button>

                                    <button id="start-push-button" class="action-button danger">
                                        开始推流
                                    </button>

                                    <button id="stop-push-button" class="action-button ghost">
                                        停止推流
                                    </button>
                                </div>

                                <div class="quick-actions">
                                    <button id="mute-video-button">暂停画面</button>
                                    <button id="resume-video-button">恢复画面</button>
                                    <button id="mute-audio-button">静音</button>
                                    <button id="resume-audio-button">恢复声音</button>
                                </div>

                                <p id="push-status" class="push-status">
                                    ${escapeHtml(this.status.message)}
                                </p>
                            </section>
                        </div>

                        <section class="panel doc-panel">
                            <h2>地址说明</h2>
                            <div class="doc-grid">
                                <div>
                                    <h3>推流地址</h3>
                                    <p>
                                        Web 页面推流要填 <code>webrtc://</code> 开头的推流地址。
                                        这个地址一般从腾讯云控制台的地址生成器生成。
                                    </p>
                                </div>

                                <div>
                                    <h3>不是播放地址</h3>
                                    <p>
                                        <code>https://xxx.flv</code>、<code>https://xxx.m3u8</code>、
                                        <code>rtmp://xxx</code> 这些是播放/其他协议地址，不要填进推流框。
                                    </p>
                                </div>

                                <div>
                                    <h3>权限要求</h3>
                                    <p>
                                        摄像头、麦克风、屏幕分享都需要浏览器授权。
                                        本地开发建议用 <code>localhost</code> 或 HTTPS。
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section class="panel statistics-panel">
                            <h2>推流统计</h2>
                            <pre id="push-statistics">${escapeHtml(this.statisticsText)}</pre>
                        </section>
                    </section>
                </main>
            </div>

            <style>
                .live-room-page {
                    min-height: calc(100vh - 90px);
                    background: #f6f7fb;
                    padding: 24px;
                }

                .live-room-shell {
                    max-width: 1320px;
                    margin: 0 auto;
                }

                .live-room-hero {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 20px;
                    margin-bottom: 20px;
                    padding: 26px;
                    border-radius: 22px;
                    background:
                        radial-gradient(circle at top right, rgba(47, 107, 255, 0.22), transparent 28%),
                        linear-gradient(135deg, #ffffff, #eef3ff);
                    box-shadow: 0 12px 30px rgba(17, 24, 39, 0.08);
                }

                .eyebrow {
                    margin: 0 0 8px;
                    color: #2f6bff;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }

                .live-room-hero h1 {
                    margin: 0;
                    font-size: 34px;
                    color: #111827;
                }

                .hero-desc {
                    max-width: 720px;
                    margin: 10px 0 0;
                    color: #5b6474;
                    line-height: 1.7;
                }

                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    border-radius: 999px;
                    background: #111827;
                    color: #fff;
                    font-size: 13px;
                    white-space: nowrap;
                }

                .badge-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #22c55e;
                    box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.16);
                }

                .live-room-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1.25fr) 420px;
                    gap: 20px;
                    align-items: start;
                }

                .panel {
                    background: #fff;
                    border-radius: 20px;
                    box-shadow: 0 12px 30px rgba(17, 24, 39, 0.08);
                    padding: 20px;
                }

                .preview-panel {
                    padding: 14px;
                }

                .control-panel h2,
                .doc-panel h2,
                .statistics-panel h2 {
                    margin: 0 0 16px;
                    color: #111827;
                    font-size: 20px;
                }

                .form-label {
                    display: block;
                    margin-bottom: 8px;
                    color: #374151;
                    font-size: 14px;
                    font-weight: 700;
                }

                .push-textarea {
                    width: 100%;
                    min-height: 110px;
                    resize: vertical;
                    padding: 12px;
                    border: 1px solid #d8dee9;
                    border-radius: 14px;
                    outline: none;
                    font-size: 13px;
                    line-height: 1.6;
                    color: #111827;
                    background: #f9fafb;
                }

                .push-textarea:focus {
                    border-color: #2f6bff;
                    background: #fff;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                    margin-top: 14px;
                }

                .form-field span {
                    display: block;
                    margin-bottom: 7px;
                    color: #4b5563;
                    font-size: 13px;
                    font-weight: 700;
                }

                .form-field select {
                    width: 100%;
                    height: 40px;
                    border: 1px solid #d8dee9;
                    border-radius: 12px;
                    padding: 0 10px;
                    background: #fff;
                    outline: none;
                }

                .button-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-top: 18px;
                }

                .action-button,
                .quick-actions button {
                    height: 40px;
                    border: 0;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 700;
                }

                .action-button.primary {
                    background: #2f6bff;
                    color: #fff;
                }

                .action-button.danger {
                    background: #ef4444;
                    color: #fff;
                }

                .action-button.ghost {
                    background: #eef2ff;
                    color: #2f3a5f;
                }

                .quick-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-top: 12px;
                }

                .quick-actions button {
                    background: #f3f4f6;
                    color: #374151;
                }

                .push-status {
                    margin: 16px 0 0;
                    padding: 12px;
                    border-radius: 14px;
                    color: #4b5563;
                    background: #f3f4f6;
                    font-size: 13px;
                    line-height: 1.6;
                    word-break: break-all;
                }

                .push-status-success {
                    color: #166534;
                    background: #dcfce7;
                }

                .push-status-error {
                    color: #991b1b;
                    background: #fee2e2;
                }

                .doc-panel {
                    margin-top: 20px;
                }

                .doc-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                }

                .doc-grid h3 {
                    margin: 0 0 8px;
                    color: #111827;
                    font-size: 16px;
                }

                .doc-grid p {
                    margin: 0;
                    color: #5b6474;
                    line-height: 1.7;
                    font-size: 14px;
                }

                code {
                    padding: 2px 6px;
                    border-radius: 6px;
                    background: #eef2ff;
                    color: #1d4ed8;
                    font-size: 12px;
                }

                .statistics-panel {
                    margin-top: 20px;
                }

                .statistics-panel pre {
                    max-height: 320px;
                    overflow: auto;
                    margin: 0;
                    padding: 14px;
                    border-radius: 14px;
                    background: #0f172a;
                    color: #dbeafe;
                    font-size: 12px;
                    line-height: 1.6;
                }

                @media (max-width: 1100px) {
                    .live-room-grid {
                        grid-template-columns: 1fr;
                    }

                    .doc-grid {
                        grid-template-columns: 1fr;
                    }

                    .live-room-hero {
                        align-items: flex-start;
                        flex-direction: column;
                    }
                }
            </style>
        `;
    }
}

customElements.define('live-pusher-page', LivePusherPage);
