/* global print */
import Renderer, { createElement } from "../../src";
import BufferedStream from "../../src/buffered-stream";

let renderer = new Renderer("<!DOCTYPE html>");

renderer.registerView(function largeList() {
	let range = Array.apply(null, Array(10000));
	return createElement("ul", null, range.map((_, i) => {
		return createElement("li", null, i);
	}));
});

render("largeList");

function render(view) {
	let stream = new BufferedStream();

	let start = new Date();
	renderer.renderView(view, null, stream, { fragment: false });
	let duration = new Date() - start;

	let html = stream.read();
	if(html.indexOf("<li>9999</li></ul>") === -1) {
		throw new Error("FAIL");
	}

	// output format corresponds (roughly) to Mocha's reporting
	print("  Nashorn");
	print(`    ✓ ${duration} ms`);
}
