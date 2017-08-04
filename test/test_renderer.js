/* global describe, it */
"use strict";

require("./es6_module_syntax");
require("./macros");
let WritableStream = require("./stream");
let renderer = require("../src/renderer");
let assert = require("assert");

describe("renderer", _ => {
	it("should generate a render function for streaming HTML documents", () => {
		let stream = new WritableStream();
		let render = renderer(); // defaults to HTML5
		render(stream, "html");

		assert.equal(stream.read(), "<!DOCTYPE html>\n<html></html>");
	});

	it("should support custom doctypes", () => {
		let stream = new WritableStream();
		let render = renderer("<!DOCTYPE … XHTML …>");
		render(stream, "html");

		assert.equal(stream.read(), "<!DOCTYPE … XHTML …>\n<html></html>");
	});

	it("should support omitting doctype for HTML fragments", () => {
		let stream = new WritableStream();
		let render = renderer(null);
		render(stream, "html");

		assert.equal(stream.read(), "<html></html>");
	});

	it("should render unknown elements which are not registered as macros", () => {
		let html = renderFragment("custom-element");

		assert.equal(html, "<custom-element></custom-element>");
	});

	it("should perform markup expansion for registered macros", () => {
		let html = renderFragment("site-index", { title: "hello world" });

		assert.equal(html, "<html>" +
				'<head><meta charset="utf-8"><title>hello world</title></head>' +
				"<body><h1>hello world</h1><p>…</p></body>" +
				"</html>");
	});
});

function renderFragment(tag, params) {
	let render = renderer(null);
	let stream = new WritableStream();
	render(stream, tag, params);
	return stream.read();
}
