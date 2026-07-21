import assert from "node:assert/strict";
import test from "node:test";

import { normalizeReturnPath, withReturnTo } from "../src/services/return-path.ts";

test("normalizeReturnPath accepts only internal hash routes", () => {
    assert.equal(normalizeReturnPath("%2Flive-watch%3FroomCode%3DROOM001"), "/live-watch?roomCode=ROOM001");
    assert.equal(normalizeReturnPath("https://example.com"), "/");
    assert.equal(normalizeReturnPath("//example.com/path"), "/");
});

test("withReturnTo safely encodes the original route", () => {
    assert.equal(
        withReturnTo("/wechat-register", "/live-watch?roomCode=ROOM001"),
        "/wechat-register?returnTo=%2Flive-watch%3FroomCode%3DROOM001",
    );
});
