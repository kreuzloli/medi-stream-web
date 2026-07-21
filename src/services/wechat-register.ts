import { buildApiUrl } from "./api";

export const WECHAT_REGISTER_TOKEN_KEY = "wechatRegisterToken";

export type RegisterFileKind = "avatar" | "doctor_cert" | "id_card_front" | "id_card_back";

export type WechatRegisterRequest = {
    registerToken: string;
    realName: string;
    nickname: string;
    identityType: "MEDICAL_WORKER" | "NON_MEDICAL_WORKER";
    hospitalId?: number;
    deptId?: number;
    doctorCertNo?: string;
    idCardNo?: string;
    mobile?: string;
    headerId?: number;
    doctorCertFileId?: number;
    idCardFrontFileId?: number;
    idCardBackFileId?: number;
};

export async function uploadWechatRegisterFile(
    registerToken: string,
    kind: RegisterFileKind,
    file: File,
): Promise<{ fileId: number; fileName: string; kind: string }> {
    const formData = new FormData();
    formData.append("registerToken", registerToken);
    formData.append("kind", kind);
    formData.append("file", file);
    console.info("[wechat-register] upload started", {
        kind,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
    });
    const response = await fetch(buildApiUrl("/wechat/qrcode/file"), {
        method: "POST",
        body: formData,
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error(await readError(response, "文件上传失败"));
    }
    const result = await response.json();
    console.info("[wechat-register] upload completed", result);
    return result;
}

export async function registerWechatAccount(request: WechatRegisterRequest): Promise<string> {
    console.info("[wechat-register] submit profile", request);
    const response = await fetch(buildApiUrl("/wechat/qrcode/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error(await readError(response, "注册失败"));
    }
    const result = await response.json() as { token?: string };
    if (!result.token) {
        throw new Error("注册成功响应缺少登录凭证");
    }
    return result.token;
}

async function readError(response: Response, fallback: string): Promise<string> {
    try {
        const body = await response.json() as { message?: string };
        return body.message || `${fallback}，HTTP ${response.status}`;
    } catch {
        return `${fallback}，HTTP ${response.status}`;
    }
}
