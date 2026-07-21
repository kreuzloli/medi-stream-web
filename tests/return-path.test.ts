import assert from "node:assert/strict";
import test from "node:test";

import {
    isCurrentHashRoute,
    normalizeReturnPath,
    withReturnTo,
} from "../src/services/return-path.ts";

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

test("isCurrentHashRoute detects navigation back to the unchanged live room", () => {
    assert.equal(
        isCurrentHashRoute(
            "#/live-watch?roomCode=LR_C6756204749C447FA4EE536359045196",
            "/live-watch?roomCode=LR_C6756204749C447FA4EE536359045196",
        ),
        true,
    );
    assert.equal(isCurrentHashRoute("#/", "/live-watch?roomCode=ROOM001"), false);
});
