import type {
    ApiResponse,
    CertificateDetail,
    CertificateQuery,
    CertificateQueryResult,
    LiveItem,
    TopicItem,
    TrainingDetail,
    TrainingItem,
} from "../models/models";
import { buildApiUrl } from "./api";
import { buildAuthHeaders } from "./auth";
import { ContentNetworkError, ContentRequestError } from "./content-errors";
import {
    normalizeCertificateDetail,
    normalizeCertificateQueryResult,
    normalizeLiveList,
    normalizeTopicList,
    normalizeTrainingDetail,
    normalizeTrainingList,
} from "./content-normalizers";

/**
 * 以下路径是前后端联调前的临时契约。后端确定正式路径后只需在此处调整。
 */
const CONTENT_PATHS = {
    lives: "/lives",
    topics: "/topics",
    trainings: "/trainings",
    certificateQuery: "/certificates/query",
};

export async function fetchLives(): Promise<LiveItem[]> {
    return request(CONTENT_PATHS.lives, normalizeLiveList, "近期直播列表");
}

export async function fetchTopics(): Promise<TopicItem[]> {
    return request(CONTENT_PATHS.topics, normalizeTopicList, "专题列表");
}

export async function fetchTrainings(): Promise<TrainingItem[]> {
    return request(CONTENT_PATHS.trainings, normalizeTrainingList, "科研培训列表");
}

export async function fetchTrainingDetail(id: string): Promise<TrainingDetail> {
    return request(`${CONTENT_PATHS.trainings}/${encodeURIComponent(id)}`, requireTrainingDetail, "科研培训详情");
}

export async function queryCertificate(query: CertificateQuery): Promise<CertificateQueryResult> {
    return request(CONTENT_PATHS.certificateQuery, requireCertificateQueryResult, "证书查询", {
        method: "POST",
        body: JSON.stringify(query),
    });
}

export async function fetchCertificateDetail(id: string): Promise<CertificateDetail> {
    return request(`/certificates/${encodeURIComponent(id)}`, requireCertificateDetail, "证书详情");
}

async function request<T>(
    path: string,
    normalize: (data: unknown) => T,
    businessName: string,
    init: RequestInit = {},
): Promise<T> {
    const url = buildApiUrl(path);
    console.info("[content-api] request start", { businessName, url });

    let response: Response;
    try {
        response = await fetch(url, {
            credentials: "include",
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...buildAuthHeaders(),
                ...init.headers,
            },
        });
    } catch (error) {
        throw new ContentNetworkError(`${businessName}接口暂时无法连接`, {
            cause: error,
        });
    }

    if (!response.ok) {
        console.warn("[content-api] request failed", { businessName, status: response.status, url });
        throw new ContentRequestError(`${businessName}加载失败，HTTP ${response.status}`, response.status);
    }

    const payload = await response.json();
    const data = unwrapPayload(payload);
    const result = normalize(data);
    console.info("[content-api] request success", { businessName, url });

    return result;
}

function unwrapPayload(payload: unknown): unknown {
    if (typeof payload === "object" && payload !== null && "data" in payload) {
        return (payload as ApiResponse<unknown>).data;
    }

    return payload;
}

function requireTrainingDetail(data: unknown): TrainingDetail {
    const detail = normalizeTrainingDetail(data);
    if (!detail) {
        throw new Error("科研培训详情数据格式不正确");
    }
    return detail;
}

function requireCertificateQueryResult(data: unknown): CertificateQueryResult {
    const result = normalizeCertificateQueryResult(data);
    if (!result) {
        throw new Error("未查询到证书");
    }
    return result;
}

function requireCertificateDetail(data: unknown): CertificateDetail {
    const detail = normalizeCertificateDetail(data);
    if (!detail) {
        throw new Error("证书详情数据格式不正确");
    }
    return detail;
}
