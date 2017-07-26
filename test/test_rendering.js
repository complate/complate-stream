/* global describe, it */
require("./es6_module_syntax");
require("./macros");
let uid = require("./util").uid;
let renderer = require("../src/renderer");
let HTMLString = require("../src/html").HTMLString;
let assert = require("assert");

let { registerMacro, createElement: h } = renderer;

describe("renderer", _ => {
	it("should generate a render function for streaming HTML documents", () => {
		// defaults to HTML5
		let render = renderer();
		let stream = new WritableStream();
		return render(stream, "html").then(stream => {
			assert.equal("<!DOCTYPE html>\n<html></html>", stream.read());
		});
	});

	it("should allow custom doctypes", () => {
		// custom doctype
		let render = renderer("<!DOCTYPE … XHTML …>");
		let stream = new WritableStream();
		return render(stream, "html").then(stream => {
			assert.equal("<!DOCTYPE … XHTML …>\n<html></html>", stream.read());
		});
	});

	it("should render unknown elements", () => {
		return renderHTML("custom-element").then(html => {
			assert.equal("<!DOCTYPE html>\n<custom-element></custom-element>", html);
		});
	});

	it("should omit closing tag for void elements", () => {
		return renderHTML("input").then(html => {
			assert.equal("<!DOCTYPE html>\n<input>", html);
		});
	});

	it("should perform markup expansion for simple macros", () => {
		return renderHTML("simple", { title: "hello world" }, "foo").then(html => {
			let expected = "<!DOCTYPE html>\n<div title=\"hello world\">foo</div>";
			assert.equal(expected, html);
		});
	});

	it("should perform markup expansion for registered macros", () => {
		return renderHTML("site-index", { title: "hello world" }).then(html => {
			let expected = "<!DOCTYPE html>\n" +
					"<html>" +
					'<head><meta charset="utf-8"><title>hello world</title></head>' +
					"<body><h1>hello world</h1><p>…</p></body>" +
					"</html>";
			assert.equal(expected, html);
		});
	});

	it("should work with embedded elements", () => {
		return renderHTML("div", null,
				h("p", null, "foo")).then(html => {
					assert.equal('<!DOCTYPE html>\n<div><p>foo</p></div>', html);
				});
	});

	it("should encode contents", () => {
		return renderHTML("div", { title: "foo <i>bar</i> baz" },
				h("p", null, "lorem <em>ipsum</em> …")).then(html => {
					assert(html.includes('<div title="foo &lt;i&gt;bar&lt;/i&gt; baz">'));
					assert(html.includes("<p>lorem &lt;em&gt;ipsum&lt;/em&gt; …</p>"));
				});
	});

	it("should allow for raw HTML, cicrumventing content encoding", () => {
		return renderHTML("p", null, new HTMLString("foo <i>bar</i> baz")).then(html => {
			assert(html.includes("<p>foo <i>bar</i> baz</p>"));
		});
	});

	it("should convert parameters to suitable attributes", () => {
		return renderHTML("input", {
			type: "text",
			id: 123,
			name: null,
			title: undefined,
			autofocus: true,
			disabled: false
		}).then(html => {
			assert.equal('<!DOCTYPE html>\n<input type="text" id="123" autofocus>', html);
		});
	});

	it("should fail on invalid parameters", () => {
		return Promise.all([{}, [], new Date(), /.*/].map(obj => {
			return renderHTML("div", { title: obj }).
				then(html => assert.fail("This should never happen")).
				catch(error => assert(error.message.includes("invalid attribute")));
		}));
	});

	it("should ignore blank values for child elements", () => {
		return renderHTML("p", null, [null, "hello", undefined, "world", false]).
		then(html => {
			assert.equal("<!DOCTYPE html>\n<p>helloworld</p>", html);
		});
	});

	it("should work with functions as child elements", () => {
		return renderHTML("p", null, [() => h("foo", null, ["bar"])]).
		then(html => {
			assert.equal("<!DOCTYPE html>\n<p><foo>bar</foo></p>", html);
		});
	});

	it("should work with promises as child elements", () => {
		return renderHTML("p", null, [new Promise((resolve, reject) => {
			setTimeout(() => resolve(h("foo", null, ["bar"])), 100);
		})]).
		then(html => {
			assert.equal("<!DOCTYPE html>\n<p><foo>bar</foo></p>", html);
		});
	});
});

function renderHTML(tag, params, children) {
	let render = renderer();
	let stream = new WritableStream();

	return render(stream, tag, params, children).
		then(stream => stream.read());
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
