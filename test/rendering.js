/* global describe, it */
require("./es6_module_syntax");
let renderer = require("../src/renderer");
let uid = require("./helpers").uid;
let assert = require("assert");

let { registerMacro, createElement: h } = renderer;

describe("renderer", _ => {
	it("should generate a render function for streaming HTML documents", () => {
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
	});

	it("should render unknown elements", () => {
		let html = renderHTML("custom-element");
		assert.equal("<!DOCTYPE html>\n<custom-element></custom-element>", html);
	});

	it("should omit closing tag for void elements", () => {
		let html = renderHTML("input");
		assert.equal("<!DOCTYPE html>\n<input>", html);
	});

	it("should perform markup expansion for registered macros", () => {
		let html = renderHTML("site-index", { title: "hello world" });
		let expected = "<!DOCTYPE html>\n" +
				"<html>" +
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

	it("should convert parameters to suitable attributes", () => {
		let html = renderHTML("input", {
			type: "text",
			id: 123,
			name: null,
			title: undefined,
			autofocus: true,
			disabled: false
		});
		assert.equal('<!DOCTYPE html>\n<input type="text" id="123" autofocus>', html);
	});

	it("should ignore blank values for child elements", () => {
		let html = renderHTML("p", null, [null, "hello", undefined, "world", false]);
		assert.equal("<!DOCTYPE html>\n<p>helloworld</p>", html);
	});
});

function renderHTML(tag, params, children) {
	let render = renderer();
	let stream = new WritableStream();

	if(children) { // need to generate a container
		let container = `dummy-${uid()}`;
		registerMacro(container, _ => h(tag, params, children));
		render(stream, container);
	} else {
		render(stream, tag, params);
	}

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
