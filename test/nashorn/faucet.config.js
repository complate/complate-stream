"use strict";

module.exports = {
	js: [{
		source: "./index.js",
		target: "./dist/bundle.js",
		moduleName: "render",
		esnext: true,
		jsx: { pragma: "createElement" }
	}]
};
