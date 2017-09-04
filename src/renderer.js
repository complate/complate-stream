import generateHTML from "./html";
import { flatCompact, noop } from "./util";

// generates a pair of functions:
// `render` serves as the API for the host environment
// `registerView` allows `render` to reference registered macros by their name
export default function renderer(doctype = "<!DOCTYPE html>") {
	let macros = {};

	let registerView = (macro, name = macro.name) => {
		if(!name) {
			throw new Error(`missing name for macro: \`${macro}\``);
		}

		if(macros[name]) {
			throw new Error(`invalid macro name: \`${name}\` already registered`);
		}
		macros[name] = macro;

		return name; // primarily for debugging
	};

	// `view` is either a macro function or a string identifying a registered macro
	// `params` is a mutable key-value object which is passed to the respective macro
	// `stream` is a writable stream (cf. `generateHTML`)
	// `fragment` is a boolean determining whether to omit doctype and layout
	// `callback` is an optional function invoked upon conclusion - if provided,
	// this activates non-blocking rendering
	let render = (view, params, stream, fragment, callback) => {
		if(!fragment) {
			stream.writeln(doctype);
		}

		if(fragment) {
			if(!params) {
				params = {};
			}
			params._layout = false; // XXX: hacky? (e.g. might break due to immutability)
		}

		// resolve strings to corresponding macro
		let macro = (view && view.substr) ? macros[view] : view;
		if(!macro) {
			throw new Error(`unknown macro: \`${view}\``);
		}
		let element = createElement(macro, params);

		if(callback) { // non-blocking mode
			element(stream, true, callback);
		} else { // blocking mode
			element(stream, false, noop);
		}
	};

	return { render, registerView };
}

// distinguishes regular tags from macros
export function createElement(element, params, ...children) {
	/* eslint-disable indent */
	return element.call ?
			element(params, ...flatCompact(children)) :
			generateHTML(element, params, ...children);
	/* eslint-enable indent */
}
