import { createElement as h } from "../src/renderer";

export function SiteIndex({ title }) {
	return h(DefaultLayout, { title },
			h("h1", null, title),
			h("p", null, "…"));
}

export function BlockingContainer() {
	return h(FragmentLayout, null,
			h("p", null, "…"),
			h("p", null, callback => {
				let el = h("i", null,
						"lorem",
						callback => {
							let el = h("em", null, "…");
							callback(el);
						},
						"ipsum");
				callback(el);
			}),
			h("p", null, "…"));
}

export function NonBlockingContainer() {
	return h(FragmentLayout, null,
			h("p", null, "…"),
			h("p", null, callback => {
				setTimeout(_ => {
					let el = h("i", null, "lorem ipsum");
					callback(el);
				}, 10);
			}),
			h("p", null, "…"));
}

function DefaultLayout({ title }, ...children) {
	return h("html", null,
			h("head", null,
					h("meta", { charset: "utf-8" }),
					h("title", null, title)),
			h("body", null, children));
}

function FragmentLayout(_, ...children) {
	return h("div", null, children);
}
