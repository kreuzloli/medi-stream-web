import assert from "node:assert/strict";
import test from "node:test";

import {
    buildWechatStatusPath,
    getWechatLoginStatusPresentation,
    normalizeWechatLoginStatusResponse,
    normalizeWechatQrResponse,
} from "../src/services/wechat-login-normalizers.ts";

test("normalizeWechatQrResponse accepts the backend snake_case response", () => {
    assert.deepEqual(
        normalizeWechatQrResponse({
            session_id: "session-1",
            qr_url: "https://open.weixin.qq.com/connect/oauth2/authorize?...",
        }),
        {
            sessionId: "session-1",
            qrUrl: "https://open.weixin.qq.com/connect/oauth2/authorize?...",
        },
    );
});

test("normalizeWechatQrResponse rejects an incomplete response", () => {
    assert.throws(
        () => normalizeWechatQrResponse({ session_id: "session-1" }),
        /二维码响应格式不正确/,
    );
});

test("buildWechatStatusPath safely encodes the session id", () => {
    assert.equal(buildWechatStatusPath("session/with space"), "/wechat/status/session%2Fwith%20space");
});

test("normalizeWechatLoginStatusResponse accepts supported backend states", () => {
    assert.deepEqual(normalizeWechatLoginStatusResponse({ status: "WAITING" }), {
        status: "WAITING",
    });
    assert.deepEqual(normalizeWechatLoginStatusResponse({ status: "SCANNED" }), {
        status: "SCANNED",
    });
    assert.deepEqual(normalizeWechatLoginStatusResponse({ status: "EXPIRED" }), {
        status: "EXPIRED",
    });
});

test("normalizeWechatLoginStatusResponse rejects unknown states", () => {
    assert.throws(
        () => normalizeWechatLoginStatusResponse({ status: "UNKNOWN" }),
        /登录状态响应格式不正确/,
    );
});

test("status presentation distinguishes pending and terminal states", () => {
    assert.deepEqual(getWechatLoginStatusPresentation("WAITING"), {
        tone: "pending",
        label: "等待扫码",
        description: "请使用手机微信扫一扫",
        terminal: false,
    });
    assert.equal(getWechatLoginStatusPresentation("SCANNED").terminal, false);
    assert.equal(getWechatLoginStatusPresentation("SUCCESS").terminal, true);
    assert.equal(getWechatLoginStatusPresentation("REGISTER_REQUIRED").terminal, true);
    assert.equal(getWechatLoginStatusPresentation("EXPIRED").terminal, true);
});
