import '../../libs/tcplayer/tcplayer.min.css';
import tcPlayerUrl from '../../libs/tcplayer/tcplayer.v5.3.3.min.js?url';

type TCPlayerInstance = {
    src: (url: string) => void;
    play: () => void;
    pause: () => void;
    dispose: () => void;
};

type TCPlayerFactory = (
    id: string,
    options: {
        licenseUrl?: string;
        width?: string | number;
        height?: string | number;
        controls?: boolean;
        autoplay?: boolean;
        muted?: boolean;
        preload?: 'auto' | 'metadata' | 'none';
        language?: 'zh-CN' | 'en';
        sources?: Array<{
            src: string;
            type?: string;
        }>;
    },
) => TCPlayerInstance;

declare global {
    interface Window {
        TCPlayer?: TCPlayerFactory;
    }
}

export class LivePlayerComponent extends HTMLElement {
    private static tcPlayerScriptPromise: Promise<void> | null = null;

    private player: TCPlayerInstance | null = null;

    private initPlayerPromise: Promise<void> | null = null;

    private readonly licenseUrl =
        'https://1256203008.trtcube-license.cn/license/v2/1256203008_1/v_cube.license';

    /**
     * Web Component 被插入页面时触发。
     *
     * 简单理解：
     * 只要页面里出现 <live-player></live-player>，
     * connectedCallback 就会执行。
     */
    connectedCallback() {
        console.info('[live-player] connected');
        this.render();
        void this.initPlayer();
    }

    /**
     * Web Component 从页面移除时触发。
     *
     * 这里一定要销毁播放器。
     * 不然切页面以后，播放器可能还在后台占用资源。
     */
    disconnectedCallback() {
        console.info('[live-player] disconnected');
        this.destroy();
    }

    /**
     * 初始化腾讯云 TCPlayer。
     */
    private async initPlayer() {
        if (this.player) {
            console.info('[live-player] init skipped, player exists');
            return;
        }

        if (this.initPlayerPromise) {
            console.info('[live-player] reuse pending init promise');
            await this.initPlayerPromise;
            return;
        }

        this.initPlayerPromise = this.doInitPlayer();

        try {
            await this.initPlayerPromise;
        } finally {
            this.initPlayerPromise = null;
        }
    }

    private async doInitPlayer() {
        const videoElement = this.querySelector<HTMLVideoElement>('#tc-live-player');

        if (!videoElement) {
            console.warn('[live-player] video element not found');
            return;
        }

        try {
            console.info('[live-player] load TCPlayer script start');
            await LivePlayerComponent.loadTcPlayerScript();
        } catch (error) {
            console.error('TCPlayer script load failed', error);
            this.dispatchStatus('播放器脚本加载失败', 'error');
            return;
        }

        if (!this.isConnected) {
            console.info('[live-player] init stopped, component disconnected');
            return;
        }

        if (!window.TCPlayer) {
            console.error('[live-player] TCPlayer factory missing after script loaded');
            this.dispatchStatus('播放器脚本加载失败', 'error');
            return;
        }

        console.info('[live-player] create TCPlayer instance');
        this.player = window.TCPlayer('tc-live-player', {
            licenseUrl: this.licenseUrl,
            width: '100%',
            height: '100%',
            controls: true,
            autoplay: false,
            muted: false,
            preload: 'auto',
            language: 'zh-CN',
            sources: [],
        }) as TCPlayerInstance;
    }

    /**
     * 播放直播地址。
     *
     * @param url 真正的直播播放地址，不是 License URL。
     */
    public async play(url: string) {
        console.info('[live-player] play requested', {
            hasUrl: Boolean(url),
        });

        if (!this.player) {
            await this.initPlayer();
        }

        if (!this.player) {
            this.dispatchStatus('播放器初始化失败', 'error');
            return;
        }

        this.player.src(url);
        this.player.play();

        // 状态文案保留完整地址，方便本地排查具体播放源；日志里不打印完整 URL。
        this.dispatchStatus(`正在播放：${url}`, 'success');
    }

    /**
     * 暂停播放。
     */
    public pause() {
        if (!this.player) {
            console.warn('[live-player] pause failed, player not initialized');
            this.dispatchStatus('播放器还没有初始化', 'error');
            return;
        }

        console.info('[live-player] pause');
        this.player.pause();
        this.dispatchStatus('已暂停', 'normal');
    }

    /**
     * 销毁播放器。
     */
    public destroy() {
        if (!this.player) {
            console.info('[live-player] destroy skipped, player not initialized');
            return;
        }

        console.info('[live-player] destroy');
        this.player.dispose();
        this.player = null;

        this.dispatchStatus('播放器已销毁', 'normal');
    }

    /**
     * 向外通知播放状态。
     *
     * 页面可以监听 live-player-status 事件，
     * 然后更新自己的状态文案。
     */
    private dispatchStatus(message: string, type: 'normal' | 'success' | 'error') {
        console.info('[live-player] dispatch status', {
            type,
            hasMessage: Boolean(message),
        });

        this.dispatchEvent(
            new CustomEvent('live-player-status', {
                detail: {
                    message,
                    type,
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    private static loadTcPlayerScript() {
        if (window.TCPlayer) {
            console.info('[live-player] TCPlayer script already available');
            return Promise.resolve();
        }

        if (LivePlayerComponent.tcPlayerScriptPromise) {
            console.info('[live-player] reuse TCPlayer script loading promise');
            return LivePlayerComponent.tcPlayerScriptPromise;
        }

        LivePlayerComponent.tcPlayerScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = tcPlayerUrl;
            script.async = true;
            script.onload = () => {
                console.info('[live-player] TCPlayer script loaded');
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load TCPlayer script: ${tcPlayerUrl}`));
            document.head.appendChild(script);
        });

        return LivePlayerComponent.tcPlayerScriptPromise;
    }

    /**
     * 渲染播放器容器。
     */
    private render() {
        this.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .player-wrap {
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000000;
        }

        #tc-live-player {
          width: 100%;
          height: 100%;
          display: block;
          background: #000000;
        }
      </style>

      <div class="player-wrap">
        <video
          id="tc-live-player"
          preload="auto"
          playsinline
          webkit-playsinline
          x5-playsinline
        ></video>
      </div>
    `;
    }
}

customElements.define('live-player', LivePlayerComponent);
