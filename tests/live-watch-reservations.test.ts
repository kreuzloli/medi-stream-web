import assert from "node:assert/strict";
import test from "node:test";

import { renderLiveWatchReservations } from "../src/pages/live-watch-reservations.ts";

test("renderLiveWatchReservations renders two non-interactive planned features", () => {
    const html = renderLiveWatchReservations();

    assert.match(html, /直播二维码/);
    assert.match(html, /直播聊天室/);
    assert.equal(html.match(/功能规划中/g)?.length, 2);
    assert.doesNotMatch(html, /<(?:a|button)\b/i);
});
