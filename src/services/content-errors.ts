/**
 * 明确区分网络不可达和后端已返回的 HTTP 错误，避免错误地启用演示数据。
 */
export class ContentNetworkError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "ContentNetworkError";
    }
}

export class ContentRequestError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ContentRequestError";
        this.status = status;
    }
}
