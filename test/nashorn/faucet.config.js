"use strict";

module.exports = {
	js: [{
		source: "./index.js",
		target: "./dist/bundle.js",
		moduleName: "render",
		transpiler: {
			features: ["es2015", "jsx"],
			jsx: { pragma: "createElement" }
		}
	}]
};
