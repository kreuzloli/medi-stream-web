import type {
    CertificateDetail,
    CertificateQuery,
    CertificateQueryResult,
    TopicItem,
    TrainingDetail,
    TrainingItem,
} from "../models/models";

/**
 * 归一化专题列表，兼容后端直接返回数组以及常见列表字段。
 */
export function normalizeTopicList(data: unknown): TopicItem[] {
    return normalizeList(data, "topics").filter(isTopicItem);
}

/**
 * 归一化科研培训列表，避免页面依赖后端统一响应包的具体字段名。
 */
export function normalizeTrainingList(data: unknown): TrainingItem[] {
    return normalizeList(data, "trainings").filter(isTrainingItem);
}

/**
 * 提取培训详情。接口可以直接返回详情，也可以放在 item/detail 字段中。
 */
export function normalizeTrainingDetail(data: unknown): TrainingDetail | null {
    const detail = normalizeDetail(data, "training");
    return isTrainingDetail(detail) ? detail : null;
}

/**
 * 查询前只校验业务必填项，不在前端猜测身份证或手机号的后端校验规则。
 */
export function validateCertificateQuery(query: CertificateQuery): string | null {
    if (!query.name.trim()) {
        return "请输入姓名";
    }

    if (!query.idNumber.trim()) {
        return "请输入身份证号码";
    }

    if (!query.phone.trim()) {
        return "请输入手机号码";
    }

    return null;
}

/**
 * 归一化证书查询结果，仅把可用于详情跳转的 ID 暴露给页面。
 */
export function normalizeCertificateQueryResult(data: unknown): CertificateQueryResult | null {
    const detail = normalizeDetail<CertificateQueryResult>(data, "result");

    return detail && typeof detail.certificateId === "string" ? detail : null;
}

/**
 * 归一化证书详情，兼容 certificate、detail 和 item 包装字段。
 */
export function normalizeCertificateDetail(data: unknown): CertificateDetail | null {
    const detail = normalizeDetail(data, "certificate");
    return isCertificateDetail(detail) ? detail : null;
}

function normalizeList(data: unknown, businessKey: string): unknown[] {
    if (Array.isArray(data)) {
        return data;
    }

    if (!isRecord(data)) {
        return [];
    }

    const values = [data[businessKey], data.items, data.list];
    const list = values.find((value) => Array.isArray(value));

    return (list as unknown[] | undefined) ?? [];
}

function normalizeDetail<T extends Record<string, unknown>>(data: unknown, businessKey: string): T | null {
    if (!isRecord(data)) {
        return null;
    }

    const candidate = data[businessKey] ?? data.detail ?? data.item ?? data;

    return isRecord(candidate) ? (candidate as T) : null;
}

function isTopicItem(value: unknown): value is TopicItem {
    return isRecord(value)
        && typeof value.id === "number"
        && typeof value.title === "string"
        && typeof value.latestText === "string"
        && typeof value.followed === "boolean"
        && Array.isArray(value.minors)
        && value.minors.every((minor) => typeof minor === "string");
}

function isTrainingItem(value: unknown): value is TrainingItem {
    return isRecord(value)
        && typeof value.id === "string"
        && typeof value.title === "string"
        && typeof value.date === "string";
}

function isTrainingDetail(value: unknown): value is TrainingDetail {
    if (!isTrainingItem(value) || !isRecord(value)) {
        return false;
    }

    const record = value as unknown as Record<string, unknown>;

    return typeof record.source === "string"
        && Array.isArray(record.paragraphs)
        && record.paragraphs.every((paragraph: unknown) => typeof paragraph === "string");
}

function isCertificateDetail(value: unknown): value is CertificateDetail {
    if (!isRecord(value)) {
        return false;
    }

    const requiredFields = [
        "id", "name", "gender", "idNumber", "certificateName", "certificateNumber", "issueDate", "level",
    ];

    return requiredFields.every((field) => typeof value[field] === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
