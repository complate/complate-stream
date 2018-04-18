"use strict";

module.exports = {
	js: [{
		source: "./index.js",
		target: "./dist/bundle.js",
		exports: "render",
		esnext: true,
		jsx: { pragma: "createElement" }
	}]
};
