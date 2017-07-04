/* global describe, it */
require("./es6_module_syntax");
let util = require("../src/util");
let assert = require("assert");

describe("flatCompact", _ => {
	it("should flatten nested arrays", () => {
		assert.deepStrictEqual([1, 2, 3, 4, 5, 6],
				util.flatCompact([1, [2, [3, 4], 5], 6]));
	});

	it("should discard blank values (i.e. `undefined` and `null`)", () => {
		assert.deepStrictEqual(["foo", "bar", 0, "baz", ""],
				util.flatCompact([[null, "foo"], ["bar", 0],
						["baz", undefined, ""]]));
	});
});
