import assert from "node:assert/strict";
import test from "node:test";

import {
    normalizeCertificateDetail,
    normalizeCertificateQueryResult,
    normalizeLiveList,
    normalizeTopicList,
    normalizeTrainingDetail,
    normalizeTrainingList,
    validateCertificateQuery,
} from "../src/services/content-normalizers.ts";

test("normalizeLiveList accepts a live list envelope", () => {
    const lives = normalizeLiveList({
        lives: [{ id: "live-1", label: "今天", time: "13:20", isToday: true, title: "直播" }],
    });

    assert.equal(lives.length, 1);
    assert.equal(lives[0]?.id, "live-1");
});

test("normalizeTopicList accepts the supported list envelope", () => {
    const topics = normalizeTopicList({
        items: [{ id: 1, title: "专题", latestText: "最新一期", followed: true, minors: [] }],
    });

    assert.equal(topics.length, 1);
    assert.equal(topics[0]?.title, "专题");
});

test("normalizeTopicList drops items with missing required fields", () => {
    assert.deepEqual(normalizeTopicList({ items: [{ id: 1, title: "专题" }] }), []);
});

test("normalizeTrainingList rejects malformed list data", () => {
    assert.deepEqual(normalizeTrainingList({ list: "invalid" }), []);
});

test("normalizeTrainingDetail unwraps a detail object", () => {
    const detail = normalizeTrainingDetail({
        item: {
            id: "training-1",
            title: "培训",
            date: "2026-7-7",
            source: "来源",
            paragraphs: ["正文"],
        },
    });

    assert.equal(detail?.id, "training-1");
});

test("validateCertificateQuery requires all three business fields", () => {
    assert.equal(
        validateCertificateQuery({ name: "郭靖", idNumber: "", phone: "13800000000" }),
        "请输入身份证号码",
    );
    assert.equal(
        validateCertificateQuery({ name: "郭靖", idNumber: "22010419860812131X", phone: "13800000000" }),
        null,
    );
});

test("normalizeCertificateQueryResult accepts an id result", () => {
    assert.deepEqual(normalizeCertificateQueryResult({ certificateId: "certificate-1" }), {
        certificateId: "certificate-1",
    });
});

test("normalizeCertificateDetail accepts a wrapped certificate", () => {
    const certificate = normalizeCertificateDetail({
        certificate: {
            id: "certificate-1",
            name: "郭靖",
            gender: "男",
            idNumber: "123",
            certificateName: "证书",
            certificateNumber: "NO-1",
            issueDate: "2026-01-01",
            level: "无",
        },
    });

    assert.equal(certificate?.name, "郭靖");
});

test("normalizeCertificateDetail rejects incomplete personal data", () => {
    assert.equal(normalizeCertificateDetail({ certificate: { id: "certificate-1", name: "郭靖" } }), null);
});
