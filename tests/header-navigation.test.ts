import assert from "node:assert/strict";
import test from "node:test";

import { isHeaderNavActive } from "../src/components/header/header-navigation.ts";

test("home is active only on the root route", () => {
    assert.equal(isHeaderNavActive("/", "/"), true);
    assert.equal(isHeaderNavActive("/", "/topics"), false);
});

test("content sections remain active on their detail route", () => {
    assert.equal(isHeaderNavActive("/training", "/training-detail"), true);
    assert.equal(isHeaderNavActive("/certificates", "/certificate-detail"), true);
});
