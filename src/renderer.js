import generateHTML from "./html";
import { flatCompact, noop } from "./util";

// distinguishes macros from regular tags
export function createElement(element, params, ...children) {
	if(element === undefined) {
		// TODO; provide context by stringifying `params` + `children` via `generateHTML`
		throw new Error("invalid macro: `undefined`");
	}
	/* eslint-disable indent */
	return element.call ?
			element(params === null ? {} : params, ...flatCompact(children)) :
			generateHTML(element, params, ...children);
	/* eslint-enable indent */
}

// a renderer typically provides the interface to the host environment
// it maps views' string identifiers to the corresponding macros and supports
// both HTML documents and fragments
// `log` is an optional logging function with the signature `(level, message)`
// (cf. `generateHTML`)
export default class Renderer {
	constructor({ doctype = "<!DOCTYPE html>", log } = {}) {
		this.doctype = doctype;
		this.log = log;
		this._macroRegistry = {};

		// bind methods for convenience
		["registerView", "renderView"].forEach(meth => {
			this[meth] = this[meth].bind(this);
		});
	}

	registerView(macro, name = macro.name, replace) {
		if(!name) {
			throw new Error(`missing name for macro: \`${macro}\``);
		}

		let macros = this._macroRegistry;
		if(macros[name] && !replace) {
			throw new Error(`invalid macro name: \`${name}\` already registered`);
		}
		macros[name] = macro;

		return name; // primarily for debugging
	}

	// `view` is either a macro function or a string identifying a registered macro
	// `params` is a mutable key-value object which is passed to the respective macro
	// `stream` is a writable stream (cf. `generateHTML`)
	// `fragment` is a boolean determining whether to omit doctype and layout
	// `callback` is an optional function invoked upon conclusion - if provided,
	// this activates non-blocking rendering
	renderView(view, params, stream, { fragment } = {}, callback) {
		if(!fragment) {
			stream.writeln(this.doctype);
		}

		if(fragment) {
			if(!params) {
				params = {};
			}
			params._layout = false; // XXX: hacky? (e.g. might break due to immutability)
		}

		// resolve string identifier to corresponding macro
		let viewName = view && view.substr && view;
		let macro = viewName ? this._macroRegistry[viewName] : view;
		if(!macro) {
			throw new Error(`unknown view macro: \`${view}\` is not registered`);
		}

		// augment logging with view context
		let log = this.log && ((level, message) => this.log(level,
				`<${viewName || macro.name}> ${message}`));

		let element = createElement(macro, params);
		if(callback) { // non-blocking mode
			element(stream, { nonBlocking: true, log }, callback);
		} else { // blocking mode
			element(stream, { nonBlocking: false, log }, noop);
		}
	}
}
