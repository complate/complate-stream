let config = {
	manifest: false,
	bundles: [{
		entryPoint: "./index.js",
		target: "./dist/bundle.js",
		moduleName: "render",
		transpiler: {
			features: ["es2015", "jsx"],
			jsx: { pragma: "createElement" }
		}
	}]
};

module.exports = {
	js: config
};
