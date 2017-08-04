/* global describe, it */
require("./es6_module_syntax");
require("./macros");
let renderer = require("../src/renderer");
let { HTMLString } = require("../src/html");
let assert = require("assert");

let { createElement: h } = renderer;

describe("renderer", _ => {
	it("should generate a render function for streaming HTML documents/fragments", () => {
		// defaults to HTML5
		let render = renderer();
		let stream = new WritableStream();
		render(stream, "html");
		let expected = "<!DOCTYPE html>\n<html></html>";
		assert.equal(expected, stream.read());

		// custom doctype
		render = renderer("<!DOCTYPE … XHTML …>");
		stream = new WritableStream();
		render(stream, "html");
		expected = "<!DOCTYPE … XHTML …>\n<html></html>";
		assert.equal(expected, stream.read());

		// suppressed doctype
		render = renderer(null);
		stream = new WritableStream();
		render(stream, "html");
		expected = "<html></html>";
		assert.equal(expected, stream.read());
	});

	it("should render unknown elements", () => {
		let html = renderHTML("custom-element");
		assert.equal("<custom-element></custom-element>", html);
	});

	it("should omit closing tag for void elements", () => {
		let html = renderHTML("input");
		assert.equal("<input>", html);
	});

	it("should perform markup expansion for registered macros", () => {
		let html = renderHTML("site-index", { title: "hello world" });
		let expected = "<html>" +
				'<head><meta charset="utf-8"><title>hello world</title></head>' +
				"<body><h1>hello world</h1><p>…</p></body>" +
				"</html>";
		assert.equal(expected, html);
	});

	it("should encode contents", () => {
		let html = renderHTML("div", { title: "foo <i>bar</i> baz" },
				h("p", null, "lorem <em>ipsum</em> …"));
		assert(html.includes('<div title="foo &lt;i&gt;bar&lt;/i&gt; baz">'));
		assert(html.includes("<p>lorem &lt;em&gt;ipsum&lt;/em&gt; …</p>"));
	});

	it("should allow for raw HTML, cicrumventing content encoding", () => {
		let html = renderHTML("p", null, new HTMLString("foo <i>bar</i> baz"));
		assert(html.includes("<p>foo <i>bar</i> baz</p>"));
	});

	it("should convert parameters to suitable attributes", () => {
		let html = renderHTML("input", {
			type: "text",
			id: 123,
			name: null,
			title: undefined,
			autofocus: true,
			disabled: false
		});
		assert.equal('<input type="text" id="123" autofocus>', html);

		[{}, [], new Date(), /.*/].forEach(obj => {
			let fn = _ => renderHTML("div", { title: obj });
			assert.throws(fn, /invalid attribute/);
		});
	});

	it("should support both elements and strings/numbers as child elements", () => {
		let html = renderHTML("p", null,
				h("em", null, "hello"),
				"lorem ipsum",
				h("mark", null, "world"),
				123);
		assert.equal("<p><em>hello</em>lorem ipsum<mark>world</mark>123</p>",
				html);
	});

	it("should ignore blank values for child elements", () => {
		let html = renderHTML("p", null, null, "hello", undefined, "world", false);
		assert.equal("<p>helloworld</p>", html);
	});

	it("should support nested arrays for child elements", () => {
		let html = renderHTML("p", null, "foo", ["hello", ["…", "…"], "world"], "bar");
		assert.equal("<p>foohello……worldbar</p>", html);
	});
});

function renderHTML(tag, params, ...children) {
	let render = renderer(null);
	let stream = new WritableStream();

	if(children.length) { // `documentRenderer` does not support child elements
		params = Object.assign({}, params, {
			_tag: tag,
			_children: children
		});
		tag = "dummy-container";
	}
	render(stream, tag, params);

	return stream.read();
}

class WritableStream {
	constructor() {
		this._buffer = [];
	}

	writeln(msg) {
		this.write(`${msg}\n`);
	}

	write(msg) {
		this._buffer.push(msg);
	}

	flush() {
		// no-op
	}

	read() {
		return this._buffer.join("");
	}
}
