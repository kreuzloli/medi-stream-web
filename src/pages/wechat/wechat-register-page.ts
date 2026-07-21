import "../../components/header/header";
import { getHashQueryParam, navigateTo } from "../../router";
import { saveToken } from "../../services/auth";
import { fetchRegistrationOptions, type DepartmentOption, type HospitalOption } from "../../services/registration-options";
import { normalizeReturnPath } from "../../services/return-path";
import {
    registerWechatAccount,
    uploadWechatRegisterFile,
    WECHAT_REGISTER_TOKEN_KEY,
    type RegisterFileKind,
    type WechatRegisterRequest,
} from "../../services/wechat-register";
import { defineElement, escapeHtml } from "../../utils/utils";

type FileIds = Partial<Record<RegisterFileKind, number>>;

/** 微信扫码后的资料补全页面；未持有一次性注册凭证时不会提交任何资料。 */
export class WechatRegisterPage extends HTMLElement {
    private hospitals: HospitalOption[] = [];
    private departments: DepartmentOption[] = [];
    private fileIds: FileIds = {};
    private avatarPreviewUrl = "";

    connectedCallback(): void {
        console.info("[wechat-register-page] connected", {
            returnTo: getHashQueryParam("returnTo"),
            hasRegisterToken: Boolean(sessionStorage.getItem(WECHAT_REGISTER_TOKEN_KEY)),
        });
        this.render(true);
        void this.loadOptions();
    }

    disconnectedCallback(): void {
        if (this.avatarPreviewUrl) URL.revokeObjectURL(this.avatarPreviewUrl);
    }

    private async loadOptions(): Promise<void> {
        try {
            const options = await fetchRegistrationOptions();
            this.hospitals = options.hospitals;
            this.departments = options.departments;
            this.render(false);
        } catch (error) {
            this.render(false, error instanceof Error ? error.message : "选项加载失败");
        }
    }

    private render(loading: boolean, loadError = ""): void {
        const registerToken = sessionStorage.getItem(WECHAT_REGISTER_TOKEN_KEY);
        this.innerHTML = `
            <div class="register-page">
                <medi-header></medi-header>
                <main class="register-shell">
                    <section class="register-intro">
                        <span class="register-eyebrow">WECHAT VERIFIED</span>
                        <h1>完成个人资料</h1>
                        <p>微信身份已经验证。请填写真实资料，保存后即可登录并返回刚才的页面。</p>
                        <div class="register-security-note">资料仅用于账号认证与医疗专业身份审核</div>
                    </section>
                    <section class="register-card">
                        ${!registerToken ? this.renderMissingToken() : `
                            <form data-register-form>
                                <div class="register-section-heading">
                                    <div><span>01</span><h2>基础信息</h2></div>
                                    <p><em>*</em> 为必填项</p>
                                </div>
                                <div class="register-avatar-row">
                                    <div class="register-avatar-preview" data-avatar-preview>头像</div>
                                    ${this.fileControl("avatar", "上传头像", "支持 JPG、PNG、WebP，最大 10MB")}
                                </div>
                                <div class="register-grid">
                                    ${this.input("realName", "真实姓名", true, "请输入真实姓名")}
                                    ${this.input("nickname", "昵称", true, "用于页面展示")}
                                    ${this.input("mobile", "联系电话", false, "请输入联系电话")}
                                    <label class="register-field"><span>身份类型 <em>*</em></span>
                                        <select name="identityType" data-identity-type required>
                                            <option value="MEDICAL_WORKER">医疗从业者</option>
                                            <option value="NON_MEDICAL_WORKER">非医疗从业者</option>
                                        </select>
                                    </label>
                                </div>
                                <div class="register-section-heading register-section-heading--spaced" data-medical-heading>
                                    <div><span>02</span><h2>执业信息</h2></div>
                                    <p>医疗从业者必填医院与科室</p>
                                </div>
                                <div data-medical-fields>
                                    <div class="register-grid">
                                        ${this.select("hospitalId", "所属医院", this.hospitals.map(item => [item.id, item.hospitalName]), loading)}
                                        ${this.select("deptId", "所属科室", this.departments.map(item => [item.deptId, item.deptName]), loading)}
                                        ${this.input("doctorCertNo", "执业证编号", false, "选填")}
                                        ${this.input("idCardNo", "身份证号", false, "选填")}
                                    </div>
                                    <div class="register-files-grid">
                                        ${this.fileControl("doctor_cert", "执业资格证", "图片或 PDF")}
                                        ${this.fileControl("id_card_front", "身份证人像面", "图片或 PDF")}
                                        ${this.fileControl("id_card_back", "身份证国徽面", "图片或 PDF")}
                                    </div>
                                </div>
                                ${loadError ? `<p class="register-message register-message--error">${escapeHtml(loadError)}</p>` : ""}
                                <p class="register-message" data-register-message aria-live="polite"></p>
                                <button class="register-submit" type="submit" ${loading ? "disabled" : ""}>
                                    保存资料并登录
                                </button>
                            </form>
                        `}
                    </section>
                </main>
            </div>
        `;
        if (registerToken) this.bindEvents(registerToken);
    }

    private bindEvents(registerToken: string): void {
        const form = this.querySelector<HTMLFormElement>("[data-register-form]");
        const identity = this.querySelector<HTMLSelectElement>("[data-identity-type]");
        identity?.addEventListener("change", () => this.updateMedicalVisibility());
        this.updateMedicalVisibility();

        this.querySelectorAll<HTMLInputElement>("input[type=file][data-kind]").forEach(input => {
            input.addEventListener("change", () => void this.uploadFile(registerToken, input));
        });
        form?.addEventListener("submit", event => {
            event.preventDefault();
            void this.submit(registerToken, form);
        });
    }

    private updateMedicalVisibility(): void {
        const medical = this.querySelector<HTMLSelectElement>("[data-identity-type]")?.value === "MEDICAL_WORKER";
        this.querySelector<HTMLElement>("[data-medical-fields]")?.toggleAttribute("hidden", !medical);
        this.querySelector<HTMLElement>("[data-medical-heading]")?.toggleAttribute("hidden", !medical);
        ["hospitalId", "deptId"].forEach(name => {
            const field = this.querySelector<HTMLSelectElement>(`[name=${name}]`);
            if (field) field.required = medical;
        });
    }

    private async uploadFile(registerToken: string, input: HTMLInputElement): Promise<void> {
        const file = input.files?.[0];
        const kind = input.dataset.kind as RegisterFileKind;
        if (!file) return;
        const status = input.closest<HTMLElement>(".register-upload")?.querySelector<HTMLElement>("[data-upload-status]");
        if (status) status.textContent = "上传中…";
        input.disabled = true;
        try {
            const result = await uploadWechatRegisterFile(registerToken, kind, file);
            this.fileIds[kind] = result.fileId;
            if (status) status.textContent = `已上传：${result.fileName}`;
            if (kind === "avatar") {
                if (this.avatarPreviewUrl) URL.revokeObjectURL(this.avatarPreviewUrl);
                this.avatarPreviewUrl = URL.createObjectURL(file);
                const preview = this.querySelector<HTMLElement>("[data-avatar-preview]");
                if (preview) {
                    preview.innerHTML = `<img src="${this.avatarPreviewUrl}" alt="头像预览">`;
                }
            }
        } catch (error) {
            if (status) status.textContent = error instanceof Error ? error.message : "上传失败";
        } finally {
            input.disabled = false;
        }
    }

    private async submit(registerToken: string, form: HTMLFormElement): Promise<void> {
        const submit = form.querySelector<HTMLButtonElement>(".register-submit");
        const message = form.querySelector<HTMLElement>("[data-register-message]");
        const data = new FormData(form);
        const identityType = data.get("identityType") as WechatRegisterRequest["identityType"];
        const medical = identityType === "MEDICAL_WORKER";
        const request: WechatRegisterRequest = {
            registerToken,
            realName: String(data.get("realName") || "").trim(),
            nickname: String(data.get("nickname") || "").trim(),
            identityType,
            mobile: optionalText(data, "mobile"),
            hospitalId: medical ? optionalNumber(data, "hospitalId") : undefined,
            deptId: medical ? optionalNumber(data, "deptId") : undefined,
            doctorCertNo: medical ? optionalText(data, "doctorCertNo") : undefined,
            idCardNo: medical ? optionalText(data, "idCardNo") : undefined,
            headerId: this.fileIds.avatar,
            doctorCertFileId: medical ? this.fileIds.doctor_cert : undefined,
            idCardFrontFileId: medical ? this.fileIds.id_card_front : undefined,
            idCardBackFileId: medical ? this.fileIds.id_card_back : undefined,
        };
        console.info("[wechat-register-page] registration submit", request);
        if (submit) submit.disabled = true;
        if (message) {
            message.className = "register-message";
            message.textContent = "正在保存资料…";
        }
        try {
            const token = await registerWechatAccount(request);
            saveToken(token);
            sessionStorage.removeItem(WECHAT_REGISTER_TOKEN_KEY);
            const returnTo = normalizeReturnPath(getHashQueryParam("returnTo"));
            console.info("[wechat-register-page] registration completed", { returnTo });
            navigateTo(returnTo);
        } catch (error) {
            if (message) {
                message.className = "register-message register-message--error";
                message.textContent = error instanceof Error ? error.message : "资料保存失败";
            }
            if (submit) submit.disabled = false;
        }
    }

    private input(name: string, label: string, required: boolean, placeholder: string): string {
        return `<label class="register-field"><span>${label}${required ? " <em>*</em>" : ""}</span><input name="${name}" ${required ? "required" : ""} placeholder="${placeholder}"></label>`;
    }

    private select(name: string, label: string, options: Array<[number, string]>, loading: boolean): string {
        return `<label class="register-field"><span>${label} <em>*</em></span><select name="${name}" required ${loading ? "disabled" : ""}><option value="">${loading ? "正在加载…" : `请选择${label}`}</option>${options.map(([id, text]) => `<option value="${id}">${escapeHtml(text)}</option>`).join("")}</select></label>`;
    }

    private fileControl(kind: RegisterFileKind, label: string, hint: string): string {
        return `<label class="register-upload"><input type="file" data-kind="${kind}" accept="${kind === "avatar" ? "image/jpeg,image/png,image/webp" : "image/jpeg,image/png,image/webp,application/pdf"}"><span class="register-upload-button">选择文件</span><span><strong>${label}</strong><small>${hint}</small><small data-upload-status>尚未上传</small></span></label>`;
    }

    private renderMissingToken(): string {
        return `<div class="register-empty"><h2>注册会话已失效</h2><p>请返回首页重新使用微信扫码。</p><a href="#/">返回首页</a></div>`;
    }
}

function optionalText(data: FormData, name: string): string | undefined {
    const value = String(data.get(name) || "").trim();
    return value || undefined;
}

function optionalNumber(data: FormData, name: string): number | undefined {
    const value = Number(data.get(name));
    return Number.isFinite(value) && value > 0 ? value : undefined;
}

defineElement("wechat-register-page", WechatRegisterPage);
