let { registerMacro, createElement: h } = require("../src/renderer");

registerMacro("site-index", ({ title }) => {
	return h("default-layout", { title },
			h("h1", null, title),
			h("p", null, "…"));
});

registerMacro("default-layout", ({ title }, ...children) => {
	return h("html", null,
			h("head", null,
					h("meta", { charset: "utf-8" }),
					h("title", null, title)),
			h("body", null, children));
});
