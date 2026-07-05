import 'tcplayer.js/dist/tcplayer.min.css';
import TCPlayer from 'tcplayer.js';

type TCPlayerInstance = {
    src: (url: string) => void;
    play: () => void;
    pause: () => void;
    dispose: () => void;
};

export class LivePlayerComponent extends HTMLElement {
    private player: TCPlayerInstance | null = null;

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
        this.render();
        this.initPlayer();
    }

    /**
     * Web Component 从页面移除时触发。
     *
     * 这里一定要销毁播放器。
     * 不然切页面以后，播放器可能还在后台占用资源。
     */
    disconnectedCallback() {
        this.destroy();
    }

    /**
     * 初始化腾讯云 TCPlayer。
     */
    private initPlayer() {
        const videoElement = this.querySelector<HTMLVideoElement>('#tc-live-player');

        if (!videoElement) {
            return;
        }

        this.player = TCPlayer('tc-live-player', {
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
    public play(url: string) {
        if (!this.player) {
            this.initPlayer();
        }

        if (!this.player) {
            this.dispatchStatus('播放器初始化失败', 'error');
            return;
        }

        this.player.src(url);
        this.player.play();

        this.dispatchStatus(`正在播放：${url}`, 'success');
    }

    /**
     * 暂停播放。
     */
    public pause() {
        if (!this.player) {
            this.dispatchStatus('播放器还没有初始化', 'error');
            return;
        }

        this.player.pause();
        this.dispatchStatus('已暂停', 'normal');
    }

    /**
     * 销毁播放器。
     */
    public destroy() {
        if (!this.player) {
            return;
        }

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
