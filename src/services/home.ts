import type { ApiResponse, ChoicenessItem, ExcellentItem, HomeContent, LiveItem } from "../models/models";
import { buildApiUrl } from "./api";
import { buildAuthHeaders } from "./auth";

type HomePayload = Partial<HomeContent> & {
    lives?: LiveItem[];
    recentLives?: LiveItem[];
    topics?: ChoicenessItem[];
    selectedTopics?: ChoicenessItem[];
    videos?: ExcellentItem[];
    scienceVideos?: ExcellentItem[];
};

const HOME_API_PATH = "/home";

/**
 * 获取首页三块核心内容。
 *
 * 当前 Rust 后端还没有这个接口，所以调用方必须保留失败回退假数据的逻辑。
 */
export async function fetchHomeContent(): Promise<Partial<HomeContent>> {
    const url = buildApiUrl(HOME_API_PATH);

    console.info("[home] fetch home content start", {
        url,
    });

    const response = await fetch(url, {
        credentials: "include",
        headers: buildAuthHeaders(),
    });

    if (!response.ok) {
        console.warn("[home] fetch home content failed", {
            status: response.status,
        });

        throw new Error(`首页内容加载失败，HTTP ${response.status}`);
    }

    const payload = await response.json();
    const data = unwrapPayload(payload);
    const content = normalizeHomeContent(data);

    console.info("[home] fetch home content success", {
        liveCount: content.liveItems?.length ?? 0,
        choicenessCount: content.choicenessItems?.length ?? 0,
        excellentCount: content.excellentItems?.length ?? 0,
    });

    return content;
}

/**
 * 兼容后端统一响应包和直接返回数据两种格式。
 */
function unwrapPayload(payload: unknown): unknown {
    if (isRecord(payload) && "data" in payload) {
        return (payload as ApiResponse<unknown>).data;
    }

    return payload;
}

/**
 * 把可能变化的后端字段名归一成页面组件使用的字段名。
 */
function normalizeHomeContent(data: unknown): Partial<HomeContent> {
    if (!isRecord(data)) {
        console.warn("[home] home content payload is not object");
        return {};
    }

    const payload = data as HomePayload;

    return {
        liveItems: pickArray(payload.liveItems, payload.lives, payload.recentLives),
        choicenessItems: pickArray(payload.choicenessItems, payload.topics, payload.selectedTopics),
        excellentItems: pickArray(payload.excellentItems, payload.videos, payload.scienceVideos),
    };
}

/**
 * 按优先级取第一个数组字段。
 */
function pickArray<T>(...values: Array<T[] | undefined>): T[] | undefined {
    return values.find((value) => Array.isArray(value));
}

/**
 * 判断 unknown 是否能按对象读取字段。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
