/* global describe, it */
"use strict";

require("./es6_module_syntax");
let WritableStream = require("./stream");
let generateHTML = require("../src/html");
let assert = require("assert");

let h = generateHTML;
let { HTMLString } = generateHTML;

describe("HTML rendering", _ => {
	it("should generate a render function for streaming HTML elements", () => {
		let stream = new WritableStream();
		let el = generateHTML("body");
		el(stream);
		let html = stream.read();

		assert.equal(html, "<body></body>");
	});

	it("should correspond to the function signature prescribed by JSX", () => {
		let el = h("body", { class: "foo" }, "lorem ipsum",
				"dolor sit amet");

		assert.equal(render(el), '<body class="foo">lorem ipsumdolor sit amet</body>');
	});
});

describe("HTML elements", _ => {
	it("should support nested elements", () => {
		let el = h("foo", null,
				h("bar"));

		assert.equal(render(el), "<foo><bar></bar></foo>");
	});

	it("should support unknown elements", () => {
		let el = h("custom-element");

		assert.equal(render(el), "<custom-element></custom-element>");
	});

	it("should omit closing tag for void elements", () => {
		let el = h("input");

		assert.equal(render(el), "<input>");
	});

	it("should support both elements and strings/numbers as child elements", () => {
		let el = h("p", null,
				h("em", null, "hello"),
				"lorem ipsum",
				h("mark", null, "world"),
				123);

		assert.equal(render(el), "<p><em>hello</em>lorem ipsum<mark>world</mark>123</p>");
	});

	it("should ignore blank values for child elements", () => {
		let el = h("p", null, null, "hello", undefined, "world", false);

		assert.equal(render(el), "<p>helloworld</p>");
	});

	it("should support nested arrays for child elements", () => {
		let el = h("p", null, "foo", ["hello", ["…", "…"], "world"], "bar");

		assert.equal(render(el), "<p>foohello……worldbar</p>");
	});
});

describe("HTML attributes", _ => {
	it("should convert parameters to suitable attributes", () => {
		let el = h("input", {
			type: "text",
			id: 123,
			name: null,
			title: undefined,
			autofocus: true,
			disabled: false
		});

		assert.equal(render(el), '<input type="text" id="123" autofocus>');
	});

	it("should balk at invalid attribute names", () => {
		let names = [{}, "foo bar", 'foo"bar', "foo'bar", "foo/bar", "foo=bar"];
		names.forEach(name => {
			let stream = new WritableStream();
			let fn = _ => {
				let attribs = {};
				attribs[name] = "lipsum";

				let el = h("div", attribs);
				el(stream);
			};
			assert.throws(fn, /invalid attribute name/);
		});
	});

	it("should balk at invalid attribute values", () => {
		let values = [{}, [], new Date(), /.*/];
		values.forEach(value => {
			let stream = new WritableStream();
			let fn = _ => {
				let el = h("div", { title: value });
				el(stream);
			};
			assert.throws(fn, /invalid attribute value/);
		});
	});
});

describe("HTML encoding", _ => {
	it("should encode attributes and contents", () => {
		let el = h("div", { title: 'foo& <i>"bar"</i> \'baz' },
				h("p", null, 'lorem& <em>"ipsum"</em> \'…'));

		let html = render(el);
		assert(html.includes("<div " +
				'title="foo&amp; &lt;i&gt;&quot;bar&quot;&lt;/i&gt; &#x27;baz">'));
		assert(html.includes('<p>lorem&amp; &lt;em&gt;"ipsum"&lt;/em&gt; \'…</p>'));
	});

	it("should allow for raw HTML, cicrumventing content encoding", () => {
		let el = h("p", null, new HTMLString("foo <i>bar</i> baz"));

		let html = render(el);
		assert(html.includes("<p>foo <i>bar</i> baz</p>"));
	});
});

function render(element) {
	let stream = new WritableStream();
	element(stream);
	return stream.read();
}
