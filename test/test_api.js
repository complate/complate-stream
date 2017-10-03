/* global describe, it */
import Renderer, { createElement, generateHTML, safe } from "..";
import assert from "assert";

// XXX: crude
describe("API", _ => {
	it("should export specified API", () => {
		let renderer = new Renderer();
		assert(renderer.registerView.call);
		assert(renderer.renderView.call);

		assert(createElement.call);
		assert(generateHTML.call);
		assert(safe.call);
	});
});
