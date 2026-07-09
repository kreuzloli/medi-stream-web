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
        console.info('[live-pusher] connected');
        this.render();
        void this.initPusher();
    }

    disconnectedCallback(): void {
        console.info('[live-pusher] disconnected');
        this.destroy();
    }

    /**
     * 检查当前浏览器是否支持 WebRTC 推流能力。
     */
    public async checkSupport(): Promise<boolean> {
        console.info('[live-pusher] check support start');
        await LivePusherComponent.loadTxLivePusherScript();

        if (!window.TXLivePusher) {
            console.error('[live-pusher] TXLivePusher factory missing');
            this.dispatchStatus('TXLivePusher SDK 没有加载成功', 'error');
            return false;
        }

        const result = await window.TXLivePusher.checkSupport();
        console.info('[live-pusher] check support result', result);

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

    /**
     * 开启本地采集预览。
     */
    public async startPreview(options: {
        videoQuality: string;
        audioQuality: string;
        captureMode: 'camera' | 'screen';
    }): Promise<void> {
        console.info('[live-pusher] start preview requested', options);
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
                // 屏幕采集和摄像头采集互斥；屏幕模式不需要同时打开麦克风。
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

    /**
     * 使用 WebRTC 推流地址开始推流。
     */
    public async startPush(pushUrl: string): Promise<void> {
        console.info('[live-pusher] start push requested', {
            hasPushUrl: Boolean(pushUrl),
            isWebRtc: pushUrl.startsWith('webrtc://'),
        });

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

    /**
     * 停止云端推流。
     */
    public stopPush(): void {
        if (!this.pusher) {
            this.dispatchStatus('推流器还没有初始化', 'error');
            return;
        }

        console.info('[live-pusher] stop push');
        this.pusher.stopPush();
        this.dispatchStatus('推流已停止', 'normal');
    }

    /**
     * 停止本地采集预览，并清理 SDK 返回的流 ID。
     */
    public stopPreview(): void {
        if (!this.pusher) {
            console.info('[live-pusher] stop preview skipped, pusher not initialized');
            return;
        }

        if (this.cameraStreamId) {
            // 优先使用 SDK 返回的 streamId 停止具体采集流，避免影响其他采集源。
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

    /**
     * 暂停发送视频画面。
     */
    public muteVideo(): void {
        if (!this.pusher) {
            return;
        }

        this.pusher.pauseVideo();
        this.dispatchStatus('画面已暂停发送', 'normal');
    }

    /**
     * 恢复发送视频画面。
     */
    public resumeVideo(): void {
        if (!this.pusher) {
            return;
        }

        this.pusher.resumeVideo();
        this.dispatchStatus('画面已恢复发送', 'success');
    }

    /**
     * 暂停发送音频。
     */
    public muteAudio(): void {
        if (!this.pusher) {
            return;
        }

        this.pusher.pauseAudio();
        this.dispatchStatus('声音已暂停发送', 'normal');
    }

    /**
     * 恢复发送音频。
     */
    public resumeAudio(): void {
        if (!this.pusher) {
            return;
        }

        this.pusher.resumeAudio();
        this.dispatchStatus('声音已恢复发送', 'success');
    }

    /**
     * 销毁推流器并清理本地流状态。
     */
    public destroy(): void {
        if (!this.pusher) {
            console.info('[live-pusher] destroy skipped, pusher not initialized');
            return;
        }

        try {
            console.info('[live-pusher] destroy start');
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

    /**
     * 初始化推流 SDK，避免并发初始化创建多个实例。
     */
    private async initPusher(): Promise<void> {
        if (this.pusher) {
            console.info('[live-pusher] init skipped, pusher exists');
            return;
        }

        if (this.initPromise) {
            console.info('[live-pusher] reuse pending init promise');
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

    /**
     * 实际创建 TXLivePusher 实例并绑定 SDK 观察者。
     */
    private async doInitPusher(): Promise<void> {
        const previewContainer = this.querySelector<HTMLDivElement>('#tx-live-pusher-preview');

        if (!previewContainer) {
            console.warn('[live-pusher] preview container not found');
            this.dispatchStatus('预览容器没有找到', 'error');
            return;
        }

        try {
            console.info('[live-pusher] load TXLivePusher script start');
            await LivePusherComponent.loadTxLivePusherScript();
        } catch (error) {
            console.error('TXLivePusher script load failed', error);
            this.dispatchStatus('推流 SDK 加载失败', 'error');
            return;
        }

        if (!this.isConnected) {
            console.info('[live-pusher] init stopped, component disconnected');
            return;
        }

        if (!window.TXLivePusher) {
            console.error('[live-pusher] TXLivePusher factory missing after script loaded');
            this.dispatchStatus('TXLivePusher SDK 没有加载成功', 'error');
            return;
        }

        console.info('[live-pusher] create TXLivePusher instance');
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

    /**
     * 加载腾讯云 Web 推流 SDK 脚本。
     */
    private static loadTxLivePusherScript(): Promise<void> {
        if (window.TXLivePusher) {
            console.info('[live-pusher] TXLivePusher script already available');
            return Promise.resolve();
        }

        if (LivePusherComponent.txLivePusherScriptPromise) {
            console.info('[live-pusher] reuse TXLivePusher script loading promise');
            return LivePusherComponent.txLivePusherScriptPromise;
        }

        LivePusherComponent.txLivePusherScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');

            script.src = txLivePusherUrl;
            script.async = true;
            script.onload = () => {
                console.info('[live-pusher] TXLivePusher script loaded');
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load TXLivePusher script: ${txLivePusherUrl}`));

            document.head.appendChild(script);
        });

        return LivePusherComponent.txLivePusherScriptPromise;
    }

    /**
     * 通知宿主页面推流状态。
     */
    private dispatchStatus(message: string, type: PushStatusType): void {
        console.info('[live-pusher] dispatch status', {
            type,
            hasMessage: Boolean(message),
        });

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

    /**
     * 通知宿主页面 SDK 统计信息。
     */
    private dispatchStatistics(statistics: object): void {
        console.info('[live-pusher] dispatch statistics');
        this.dispatchEvent(
            new CustomEvent('live-pusher-statistics', {
                detail: statistics,
                bubbles: true,
                composed: true,
            }),
        );
    }

    /**
     * 从 SDK 异常对象里提取可展示错误文案。
     */
    private getErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message) {
            return error.message;
        }

        if (typeof error === 'string') {
            return error;
        }

        return fallback;
    }

    /**
     * 渲染推流预览容器。
     */
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
