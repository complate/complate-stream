/* global describe, it */
require("./es6_module_syntax");
let util = require("../src/util");
let assert = require("assert");

describe("flatCompact", _ => {
	it("should flatten nested arrays", () => {
		/* eslint-disable indent */
		assert.deepStrictEqual([1, 2, 3, 4, 5, 6],
				util.flatCompact([1, [2, [3, 4], 5], 6]));
		/* eslint-enable indent */
	});

	it("should discard blank values (i.e. `undefined`, `null` and `false`)", () => {
		/* eslint-disable indent */
		assert.deepStrictEqual(["foo", "bar", 0, "baz", ""],
				util.flatCompact([[null, "foo"], ["bar", 0, false],
						["baz", undefined, ""]]));
		/* eslint-enable indent */
	});
});
