/* global describe, it */
import { SiteIndex, BlockingContainer, NonBlockingContainer } from "./macros";
import { BufferedLogger } from "./util";
import { Fragment } from "../src";
import Renderer, { createElement } from "../src/renderer";
import BufferedStream from "../src/buffered-stream";
import assert from "assert";

describe("renderer", _ => {
	it("should generate a render function for streaming HTML documents", done => {
		let { renderer, stream } = setup(); // renderer defaults to HTML5

		renderer.renderView(HTMLRoot, null, stream, { fragment: false }, _ => {
			assert.equal(stream.read(), "<!DOCTYPE html>\n<html></html>");
			done();
		});
	});

	it("should support custom doctypes", done => {
		let { renderer, stream } = setup("<!DOCTYPE … XHTML …>");

		renderer.renderView(HTMLRoot, null, stream, { fragment: false }, _ => {
			assert.equal(stream.read(), "<!DOCTYPE … XHTML …>\n<html></html>");
			done();
		});
	});

	it("should omit doctype for HTML fragments", done => {
		let { renderer, stream } = setup();

		renderer.renderView(HTMLRoot, null, stream, { fragment: true }, _ => {
			assert.equal(stream.read(), "<html></html>");
			done();
		});
	});

	it("should support multiple root elements (via virtual fragment elements)", done => {
		let { renderer, stream } = setup();

		let view = () => {
			return createElement(Fragment, null,
					createElement("li", null, "foo"),
					createElement("li", null, "bar"),
					createElement("li", null, "baz"));
		};
		renderer.renderView(view, null, stream, { fragment: true }, _ => {
			assert.equal(stream.read(), "<li>foo</li><li>bar</li><li>baz</li>");
			done();
		});
	});

	it("should support blocking mode", done => {
		let { renderer, stream } = setup();

		renderer.renderView(BlockingContainer, null, stream, { fragment: true });
		assert.equal(stream.read(),
				"<div><p>…</p><p><i>lorem<em>…</em>ipsum</i></p><p>…</p></div>");
		done();
	});

	it("should support non-blocking mode", done => {
		let { renderer, stream } = setup();

		renderer.renderView(NonBlockingContainer, null, stream, { fragment: true }, _ => {
			assert.equal(stream.read(),
					"<div><p>…</p><p><i>lorem ipsum</i></p><p>…</p></div>");
			done();
		});
	});

	it("should detect non-blocking child elements in blocking mode", done => {
		let { renderer, stream } = setup();

		let fn = _ => renderer.renderView(NonBlockingContainer, null, stream);
		assert.throws(fn, /invalid non-blocking operation/);
		done();
	});

	it("should perform markup expansion for macros", done => {
		let { renderer, stream } = setup();

		/* eslint-disable indent */
		renderer.renderView(SiteIndex, { title: "hello world" }, stream,
				{ fragment: true }, _ => {
			assert.equal(stream.read(), "<html>" +
					'<head><meta charset="utf-8"><title>hello world</title></head>' +
					"<body><h1>hello world</h1><p>…</p></body>" +
					"</html>");
			done();
		});
		/* eslint-enable indent */
	});

	it("should resolve registered macros", done => {
		let { renderer, stream } = setup();

		renderer.registerView(SiteIndex);
		/* eslint-disable indent */
		renderer.renderView("SiteIndex", { title: "hello world" }, stream,
				{ fragment: true }, _ => {
			assert.equal(stream.read(), "<html>" +
					'<head><meta charset="utf-8"><title>hello world</title></head>' +
					"<body><h1>hello world</h1><p>…</p></body>" +
					"</html>");
			done();
		});
		/* eslint-enable indent */
	});

	it("should balk at unregistered macros", done => {
		let { renderer, stream } = setup();

		let fn = _ => renderer.renderView("foo", null, stream);
		assert.throws(fn, /unknown view macro/);
		done();
	});

	it("should support custom logging", done => {
		let { renderer, stream } = setup(); // renderer defaults to HTML5

		let logger = new BufferedLogger();
		let options = { fragment: true, log: logger.log };
		renderer.renderView(InvalidElement, null, stream, options, _ => {
			assert.equal(stream.read(), "<div></div>");

			let messages = logger.all;
			assert.equal(messages.length, 2);

			let msg = messages[0];
			assert.equal(msg.type, "error");
			assert(msg.message.includes("invalid HTML attribute name"));

			msg = messages[1];
			assert.equal(msg.type, "error");
			assert(msg.message.includes("invalid value for HTML attribute"));

			done();
		});
	});
});

function HTMLRoot() {
	return createElement("html");
}

function InvalidElement() {
	return createElement("div", { "foo=bar": "lipsum", baz: [1, 2, 3] });
}

function setup(doctype) {
	return {
		renderer: new Renderer(doctype),
		stream: new BufferedStream()
	};
}
