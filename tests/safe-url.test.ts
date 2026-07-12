import assert from "node:assert/strict";
import test from "node:test";

import { safeUrl } from "../src/utils/safe-url.ts";

test("safeUrl keeps http and hash navigation URLs", () => {
    assert.equal(safeUrl("https://example.com/image.jpg"), "https://example.com/image.jpg");
    assert.equal(safeUrl("#/training"), "#/training");
});

test("safeUrl blocks executable and unknown protocols", () => {
    assert.equal(safeUrl("javascript:alert(1)"), "");
    assert.equal(safeUrl("data:text/html,unsafe"), "");
});

test("safeUrl blocks characters that can escape an HTML attribute", () => {
    assert.equal(safeUrl('/image.jpg" onerror="alert(1)'), "");
    assert.equal(safeUrl("/image.jpg\nunsafe"), "");
});
