/* global describe, it */
import { awaitAll, flatCompact } from "../src/util";
import assert from "assert";

describe("`awaitAll`", _ => {
	it("should invoke callback only after the specified number of invocations", done => {
		let count = 0;

		let fn = awaitAll(3, _ => {
			assert.equal(count, 3);
			done();
		});

		let countingWrapper = _ => {
			count++;
			fn();
		};

		countingWrapper();
		countingWrapper();
		countingWrapper();
	});
});

describe("`flatCompact`", _ => {
	it("should flatten nested arrays", () => {
		assert.deepStrictEqual([1, 2, 3, 4, 5, 6],
				flatCompact([1, [2, [3, 4], 5], 6]));
	});

	it("should discard blank values (i.e. `undefined`, `null` and `false`)", () => {
		assert.deepStrictEqual(["foo", "bar", 0, "baz", ""],
				flatCompact([[null, "foo"], ["bar", 0, false], ["baz", undefined, ""]]));
	});
});
