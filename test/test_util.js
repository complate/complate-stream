/* global describe, it */
"use strict";

require("./es6_module_syntax");
let { flatCompact } = require("../src/util");
let assert = require("assert");

describe("flatCompact", _ => {
	it("should flatten nested arrays", () => {
		assert.deepStrictEqual([1, 2, 3, 4, 5, 6],
				flatCompact([1, [2, [3, 4], 5], 6]));
	});

	it("should discard blank values (i.e. `undefined`, `null` and `false`)", () => {
		assert.deepStrictEqual(["foo", "bar", 0, "baz", ""],
				flatCompact([[null, "foo"], ["bar", 0, false], ["baz", undefined, ""]]));
	});
});
