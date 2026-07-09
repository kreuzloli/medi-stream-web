import '../components/player/live-player';
import type { LivePlayerComponent } from '../components/player/live-player';

type LivePlayerStatus = {
    message: string;
    type: 'normal' | 'success' | 'error';
};

/**
 * 普通直播播放测试页。
 */
export class LivePage extends HTMLElement {
    connectedCallback() {
        console.info('[live-page] connected');
        this.render();
        this.bindEvents();
    }

    /**
     * 绑定播放、暂停、销毁按钮和播放器状态事件。
     */
    private bindEvents() {
        const livePlayer = this.querySelector<LivePlayerComponent>('live-player');
        const inputElement = this.querySelector<HTMLInputElement>('#live-url-input');
        const playButton = this.querySelector<HTMLButtonElement>('#play-button');
        const pauseButton = this.querySelector<HTMLButtonElement>('#pause-button');
        const destroyButton = this.querySelector<HTMLButtonElement>('#destroy-button');
        const statusElement = this.querySelector<HTMLParagraphElement>('#live-status');

        if (
            !livePlayer ||
            !inputElement ||
            !playButton ||
            !pauseButton ||
            !destroyButton ||
            !statusElement
        ) {
            console.warn('[live-page] bind events failed, element missing');
            return;
        }

        playButton.addEventListener('click', () => {
            const liveUrl = inputElement.value.trim();

            console.info('[live-page] play clicked', {
                hasLiveUrl: Boolean(liveUrl),
            });

            if (!liveUrl) {
                this.updateStatus(statusElement, {
                    message: '请输入直播播放地址，不是 License URL',
                    type: 'error',
                });
                return;
            }

            livePlayer.play(liveUrl);
        });

        pauseButton.addEventListener('click', () => {
            console.info('[live-page] pause clicked');
            livePlayer.pause();
        });

        destroyButton.addEventListener('click', () => {
            console.info('[live-page] destroy clicked');
            livePlayer.destroy();
        });

        /**
         * 监听播放器组件抛出来的状态事件。
         *
         * 子组件只负责告诉页面：
         * “我现在播放了 / 暂停了 / 出错了”
         *
         * 页面自己决定怎么展示。
         */
        livePlayer.addEventListener('live-player-status', (event) => {
            const customEvent = event as CustomEvent<LivePlayerStatus>;

            console.info('[live-page] player status', {
                type: customEvent.detail.type,
                hasMessage: Boolean(customEvent.detail.message),
            });
            this.updateStatus(statusElement, customEvent.detail);
        });
    }

    /**
     * 同步播放器状态文案和状态颜色。
     */
    private updateStatus(
        statusElement: HTMLParagraphElement,
        status: LivePlayerStatus,
    ) {
        statusElement.textContent = status.message;

        if (status.type === 'error') {
            statusElement.className = 'live-status live-status-error';
            return;
        }

        if (status.type === 'success') {
            statusElement.className = 'live-status live-status-success';
            return;
        }

        statusElement.className = 'live-status';
    }

    /**
     * 渲染播放测试页。
     */
    private render() {
        this.innerHTML = `
      <style>
        .live-page {
          min-height: 100vh;
          background: #f5f7fb;
          padding: 24px;
          box-sizing: border-box;
        }

        .live-card {
          max-width: 960px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .live-header {
          padding: 20px 24px;
          border-bottom: 1px solid #edf0f5;
        }

        .live-title {
          margin: 0;
          font-size: 22px;
          color: #111827;
        }

        .live-desc {
          margin: 8px 0 0;
          font-size: 14px;
          color: #6b7280;
        }

        .live-form {
          padding: 20px 24px 24px;
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
          border-radius: 10px;
          font-size: 14px;
          outline: none;
        }

        .live-input:focus {
          border-color: #2563eb;
        }

        .live-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .live-button {
          height: 40px;
          padding: 0 18px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
        }

        .live-button-primary {
          color: #ffffff;
          background: #2563eb;
        }

        .live-button-secondary {
          color: #111827;
          background: #e5e7eb;
        }

        .live-button-danger {
          color: #ffffff;
          background: #ef4444;
        }

        .live-status {
          margin: 14px 0 0;
          font-size: 13px;
          color: #6b7280;
          word-break: break-all;
        }

        .live-status-error {
          color: #dc2626;
        }

        .live-status-success {
          color: #16a34a;
        }

        .live-tip {
          margin-top: 12px;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
        }
      </style>

      <main class="live-page">
        <section class="live-card">
          <div class="live-header">
            <h1 class="live-title">直播播放</h1>
            <p class="live-desc">腾讯云 TCPlayer Web 播放器测试页</p>
          </div>

          <live-player></live-player>

          <div class="live-form">
            <label class="live-label" for="live-url-input">
              直播播放地址
            </label>

            <input
              id="live-url-input"
              class="live-input"
              placeholder="请输入 webrtc://xxx、https://xxx.flv 或 https://xxx.m3u8"
            />

            <div class="live-actions">
              <button id="play-button" class="live-button live-button-primary">
                播放
              </button>

              <button id="pause-button" class="live-button live-button-secondary">
                暂停
              </button>

              <button id="destroy-button" class="live-button live-button-danger">
                销毁
              </button>
            </div>

            <p id="live-status" class="live-status">
              等待输入直播播放地址
            </p>

            <p class="live-tip">
              注意：License URL 只负责授权，不能当播放地址。
              真正播放需要直播流地址，比如 FLV / HLS / WebRTC。
            </p>
          </div>
        </section>
      </main>
    `;
    }
}

customElements.define('live-page', LivePage);
