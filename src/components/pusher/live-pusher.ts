import txLivePusherUrl from '../../libs/txlivepusher/TXLivePusher-2.1.1.min.js?url';

type PushStatusType = 'normal' | 'success' | 'error';

type TXSupportResult = {
    isWebRTCSupported: boolean;
    isH264EncodeSupported: boolean;
    isH264DecodeSupported: boolean;
    isMediaDevicesSupported: boolean;
    isScreenCaptureSupported: boolean;
    isMediaFileSupported: boolean;
};

type TXLivePusherObserver = {
    onError?: (code: number, message: string, extraInfo: object) => void;
    onWarning?: (code: number, message: string, extraInfo: object) => void;
    onCaptureFirstAudioFrame?: () => void;
    onCaptureFirstVideoFrame?: () => void;
    onPushStatusUpdate?: (status: number, message: string, extraInfo: object) => void;
    onStatisticsUpdate?: (statistics: object) => void;
};

type TXLivePusherInstance = {
    setRenderView: (container: string | HTMLDivElement) => void;
    setVideoQuality: (quality: string) => void;
    setAudioQuality: (quality: string) => void;
    setProperty: (key: string, value: unknown) => void;

    startCamera: (deviceId?: string) => Promise<string>;
    stopCamera: (streamId?: string) => void;

    startMicrophone: (deviceId?: string) => Promise<string>;
    stopMicrophone: (streamId?: string) => void;

    startScreenCapture: () => Promise<string>;
    stopScreenCapture: (streamId?: string) => void;

    startPush: (pushUrl: string) => Promise<void>;
    stopPush: () => void;
    isPushing: () => boolean;

    pauseVideo: () => void;
    pauseAudio: () => void;
    resumeVideo: () => void;
    resumeAudio: () => void;

    setObserver: (observer: TXLivePusherObserver) => void;
    destroy: () => void;
};

type TXLivePusherConstructor = {
    new (): TXLivePusherInstance;
    checkSupport: () => Promise<TXSupportResult>;
};

declare global {
    interface Window {
        TXLivePusher?: TXLivePusherConstructor;
    }
}

export class LivePusherComponent extends HTMLElement {
    private static txLivePusherScriptPromise: Promise<void> | null = null;

    private pusher: TXLivePusherInstance | null = null;

    private cameraStreamId: string | null = null;

    private microphoneStreamId: string | null = null;

    private screenStreamId: string | null = null;

    private initPromise: Promise<void> | null = null;

    connectedCallback(): void {
        this.render();
        void this.initPusher();
    }

    disconnectedCallback(): void {
        this.destroy();
    }

    public async checkSupport(): Promise<boolean> {
        await LivePusherComponent.loadTxLivePusherScript();

        if (!window.TXLivePusher) {
            this.dispatchStatus('TXLivePusher SDK 没有加载成功', 'error');
            return false;
        }

        const result = await window.TXLivePusher.checkSupport();

        if (!result.isWebRTCSupported) {
            this.dispatchStatus('当前浏览器不支持 WebRTC，不能 Web 推流', 'error');
            return false;
        }

        if (!result.isMediaDevicesSupported) {
            this.dispatchStatus('当前浏览器不支持摄像头 / 麦克风采集', 'error');
            return false;
        }

        this.dispatchStatus('当前浏览器支持 Web 推流', 'success');
        return true;
    }

    public async startPreview(options: {
        videoQuality: string;
        audioQuality: string;
        captureMode: 'camera' | 'screen';
    }): Promise<void> {
        await this.initPusher();

        if (!this.pusher) {
            this.dispatchStatus('推流器初始化失败', 'error');
            return;
        }

        const isSupported = await this.checkSupport();

        if (!isSupported) {
            return;
        }

        this.pusher.setVideoQuality(options.videoQuality);
        this.pusher.setAudioQuality(options.audioQuality);

        /**
         * 调试日志先打开。
         * 后面正式上线嫌吵，可以改成 false。
         */
        this.pusher.setProperty('enableLog', true);

        try {
            if (options.captureMode === 'screen') {
                this.screenStreamId = await this.pusher.startScreenCapture();
                this.dispatchStatus('屏幕采集已开启', 'success');
                return;
            }

            this.cameraStreamId = await this.pusher.startCamera();
            this.microphoneStreamId = await this.pusher.startMicrophone();

            this.dispatchStatus('摄像头和麦克风预览已开启', 'success');
        } catch (error) {
            console.error('Start preview failed', error);
            this.dispatchStatus(this.getErrorMessage(error, '打开采集失败，请检查浏览器权限'), 'error');
        }
    }

    public async startPush(pushUrl: string): Promise<void> {
        await this.initPusher();

        if (!this.pusher) {
            this.dispatchStatus('推流器初始化失败', 'error');
            return;
        }

        if (!pushUrl.startsWith('webrtc://')) {
            this.dispatchStatus('Web 推流地址必须是 webrtc:// 开头', 'error');
            return;
        }

        try {
            await this.pusher.startPush(pushUrl);
            this.dispatchStatus('推流已开始', 'success');
        } catch (error) {
            console.error('Start push failed', error);
            this.dispatchStatus(this.getErrorMessage(error, '推流失败，请检查 WebRTC 推流地址'), 'error');
        }
    }

    public stopPush(): void {
        if (!this.pusher) {
            this.dispatchStatus('推流器还没有初始化', 'error');
            return;
        }

        this.pusher.stopPush();
        this.dispatchStatus('推流已停止', 'normal');
    }

    public stopPreview(): void {
        if (!this.pusher) {
            return;
        }

        if (this.cameraStreamId) {
            this.pusher.stopCamera(this.cameraStreamId);
            this.cameraStreamId = null;
        } else {
            this.pusher.stopCamera();
        }

        if (this.microphoneStreamId) {
            this.pusher.stopMicrophone(this.microphoneStreamId);
            this.microphoneStreamId = null;
        } else {
            this.pusher.stopMicrophone();
        }

        if (this.screenStreamId) {
            this.pusher.stopScreenCapture(this.screenStreamId);
            this.screenStreamId = null;
        }

        this.dispatchStatus('采集预览已关闭', 'normal');
    }

    public muteVideo(): void {
        if (!this.pusher) {
            return;
        }

        this.pusher.pauseVideo();
        this.dispatchStatus('画面已暂停发送', 'normal');
    }

    public resumeVideo(): void {
        if (!this.pusher) {
            return;
        }

        this.pusher.resumeVideo();
        this.dispatchStatus('画面已恢复发送', 'success');
    }

    public muteAudio(): void {
        if (!this.pusher) {
            return;
        }

        this.pusher.pauseAudio();
        this.dispatchStatus('声音已暂停发送', 'normal');
    }

    public resumeAudio(): void {
        if (!this.pusher) {
            return;
        }

        this.pusher.resumeAudio();
        this.dispatchStatus('声音已恢复发送', 'success');
    }

    public destroy(): void {
        if (!this.pusher) {
            return;
        }

        try {
            this.pusher.stopPush();
            this.stopPreview();
            this.pusher.destroy();
        } finally {
            this.pusher = null;
            this.cameraStreamId = null;
            this.microphoneStreamId = null;
            this.screenStreamId = null;
        }
    }

    private async initPusher(): Promise<void> {
        if (this.pusher) {
            return;
        }

        if (this.initPromise) {
            await this.initPromise;
            return;
        }

        this.initPromise = this.doInitPusher();

        try {
            await this.initPromise;
        } finally {
            this.initPromise = null;
        }
    }

    private async doInitPusher(): Promise<void> {
        const previewContainer = this.querySelector<HTMLDivElement>('#tx-live-pusher-preview');

        if (!previewContainer) {
            this.dispatchStatus('预览容器没有找到', 'error');
            return;
        }

        try {
            await LivePusherComponent.loadTxLivePusherScript();
        } catch (error) {
            console.error('TXLivePusher script load failed', error);
            this.dispatchStatus('推流 SDK 加载失败', 'error');
            return;
        }

        if (!this.isConnected) {
            return;
        }

        if (!window.TXLivePusher) {
            this.dispatchStatus('TXLivePusher SDK 没有加载成功', 'error');
            return;
        }

        this.pusher = new window.TXLivePusher();

        this.pusher.setRenderView(previewContainer);
        this.pusher.setVideoQuality('720p');
        this.pusher.setAudioQuality('standard');

        this.pusher.setObserver({
            onError: (code, message, extraInfo) => {
                console.error('TXLivePusher error', code, message, extraInfo);
                this.dispatchStatus(`推流错误：${code}，${message}`, 'error');
            },
            onWarning: (code, message, extraInfo) => {
                console.warn('TXLivePusher warning', code, message, extraInfo);
                this.dispatchStatus(`推流警告：${code}，${message}`, 'normal');
            },
            onCaptureFirstAudioFrame: () => {
                this.dispatchStatus('首帧音频采集完成', 'success');
            },
            onCaptureFirstVideoFrame: () => {
                this.dispatchStatus('首帧视频采集完成', 'success');
            },
            onPushStatusUpdate: (status, message, extraInfo) => {
                console.info('Push status', status, message, extraInfo);
                this.dispatchStatus(`推流状态：${status}，${message}`, status === 2 ? 'success' : 'normal');
            },
            onStatisticsUpdate: (statistics) => {
                this.dispatchStatistics(statistics);
            },
        });

        this.dispatchStatus('推流器已准备好', 'success');
    }

    private static loadTxLivePusherScript(): Promise<void> {
        if (window.TXLivePusher) {
            return Promise.resolve();
        }

        if (LivePusherComponent.txLivePusherScriptPromise) {
            return LivePusherComponent.txLivePusherScriptPromise;
        }

        LivePusherComponent.txLivePusherScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');

            script.src = txLivePusherUrl;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load TXLivePusher script: ${txLivePusherUrl}`));

            document.head.appendChild(script);
        });

        return LivePusherComponent.txLivePusherScriptPromise;
    }

    private dispatchStatus(message: string, type: PushStatusType): void {
        this.dispatchEvent(
            new CustomEvent('live-pusher-status', {
                detail: {
                    message,
                    type,
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    private dispatchStatistics(statistics: object): void {
        this.dispatchEvent(
            new CustomEvent('live-pusher-statistics', {
                detail: statistics,
                bubbles: true,
                composed: true,
            }),
        );
    }

    private getErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message) {
            return error.message;
        }

        if (typeof error === 'string') {
            return error;
        }

        return fallback;
    }

    private render(): void {
        this.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .pusher-preview {
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    background:
                        radial-gradient(circle at top left, rgba(47, 107, 255, 0.25), transparent 34%),
                        #050816;
                    border-radius: 18px;
                    overflow: hidden;
                    position: relative;
                }

                .pusher-preview::before {
                    content: "本地预览";
                    position: absolute;
                    left: 16px;
                    top: 14px;
                    z-index: 2;
                    padding: 5px 10px;
                    border-radius: 999px;
                    color: #fff;
                    background: rgba(0, 0, 0, 0.42);
                    font-size: 12px;
                }

                #tx-live-pusher-preview {
                    width: 100%;
                    height: 100%;
                }
            </style>

            <div class="pusher-preview">
                <div id="tx-live-pusher-preview"></div>
            </div>
        `;
    }
}

customElements.define('live-pusher', LivePusherComponent);
