import type { ApiResponse, Banner } from "../models/models";
import { buildApiUrl } from "./api";
import { buildAuthHeaders } from "./auth";

type BannerPayload = {
    banners?: Banner[];
    bannerItems?: Banner[];
    items?: Banner[];
    list?: Banner[];
};

/**
 * 按页面位置获取轮播图。
 *
 * placement 用来区分首页、直播页、专题页等复用场景，组件本身不直接关心接口。
 */
export async function fetchBanners(placement: string): Promise<Banner[]> {
    const url = buildApiUrl(`/banners?placement=${encodeURIComponent(placement)}`);

    console.info("[banner-api] fetch banners start", {
        placement,
        url,
    });

    const response = await fetch(url, {
        credentials: "include",
        headers: buildAuthHeaders(),
    });

    if (!response.ok) {
        console.warn("[banner-api] fetch banners failed", {
            placement,
            status: response.status,
        });

        throw new Error(`轮播图加载失败，HTTP ${response.status}`);
    }

    const payload = await response.json();
    const banners = normalizeBanners(unwrapPayload(payload));

    console.info("[banner-api] fetch banners success", {
        placement,
        count: banners.length,
    });

    return banners;
}

/**
 * 兼容后端统一响应包和直接返回数组两种格式。
 */
function unwrapPayload(payload: unknown): unknown {
    if (isRecord(payload) && "data" in payload) {
        return (payload as ApiResponse<unknown>).data;
    }

    return payload;
}

/**
 * 把轮播接口可能返回的字段名归一成 Banner 数组。
 */
function normalizeBanners(data: unknown): Banner[] {
    if (Array.isArray(data)) {
        return data as Banner[];
    }

    if (!isRecord(data)) {
        console.warn("[banner-api] banner payload is not array or object");
        return [];
    }

    const payload = data as BannerPayload;

    return pickArray(payload.banners, payload.bannerItems, payload.items, payload.list) ?? [];
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
