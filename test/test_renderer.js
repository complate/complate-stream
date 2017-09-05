/* global describe, it */
import { SiteIndex, BlockingContainer, NonBlockingContainer } from "./macros";
import WritableStream from "./stream";
import renderer, { createElement } from "../src/renderer";
import assert from "assert";

describe("renderer", _ => {
	it("should generate a render function for streaming HTML documents", done => {
		let { renderView, stream } = setup(); // renderer defaults to HTML5

		renderView(HTMLRoot, null, stream, false, _ => {
			assert.equal(stream.read(), "<!DOCTYPE html>\n<html></html>");
			done();
		});
	});

	it("should support custom doctypes", done => {
		let { renderView, stream } = setup("<!DOCTYPE … XHTML …>");

		renderView(HTMLRoot, null, stream, false, _ => {
			assert.equal(stream.read(), "<!DOCTYPE … XHTML …>\n<html></html>");
			done();
		});
	});

	it("should omit doctype for HTML fragments", done => {
		let { renderView, stream } = setup();

		renderView(HTMLRoot, null, stream, true, _ => {
			assert.equal(stream.read(), "<html></html>");
			done();
		});
	});

	it("should support blocking mode", done => {
		let { renderView, stream } = setup();

		renderView(BlockingContainer, null, stream, true);
		assert.equal(stream.read(),
				"<div><p>…</p><p><i>lorem<em>…</em>ipsum</i></p><p>…</p></div>");
		done();
	});

	it("should detect non-blocking child elements in blocking mode", done => {
		let { renderView, stream } = setup();

		let fn = _ => renderView(NonBlockingContainer, null, stream);
		assert.throws(fn, /invalid non-blocking operation/);
		done();
	});

	it("should perform markup expansion for macros", done => {
		let { renderView, stream } = setup();

		renderView(SiteIndex, { title: "hello world" }, stream, true, _ => {
			assert.equal(stream.read(), "<html>" +
					'<head><meta charset="utf-8"><title>hello world</title></head>' +
					"<body><h1>hello world</h1><p>…</p></body>" +
					"</html>");
			done();
		});
	});

	it("should resolve registered macros", done => {
		let { renderView, registerView, stream } = setup();

		registerView(SiteIndex);
		renderView("SiteIndex", { title: "hello world" }, stream, true, _ => {
			assert.equal(stream.read(), "<html>" +
					'<head><meta charset="utf-8"><title>hello world</title></head>' +
					"<body><h1>hello world</h1><p>…</p></body>" +
					"</html>");
			done();
		});
	});

	it("should balk at unregistered macros", done => {
		let { renderView, stream } = setup();

		let fn = _ => renderView("foo", null, stream);
		assert.throws(fn, /unknown macro/);
		done();
	});
});

function HTMLRoot() {
	return createElement("html");
}

function setup(doctype) {
	let stream = new WritableStream();
	let { renderView, registerView } = renderer(doctype);
	return { renderView, registerView, stream };
}
