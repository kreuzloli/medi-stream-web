import assert from "node:assert/strict";
import test from "node:test";

import { ContentNetworkError, ContentRequestError } from "../src/services/content-errors.ts";

test("network and HTTP request failures remain distinguishable", () => {
    assert.equal(new ContentNetworkError("offline") instanceof ContentNetworkError, true);
    assert.equal(new ContentRequestError("not found", 404) instanceof ContentNetworkError, false);
});
