import generateHTML from "./html";

const TAG_MACROS = {};

export default function documentRenderer(doctype = "<!DOCTYPE html>") {
	return (stream, element, params) => {
		stream.writeln(doctype);
		createElement(element, params)(stream);
	};
}

export function registerMacro(tag, fn) { // TODO: rename?
	if(TAG_MACROS[tag]) {
		throw new Error(`invalid tag macro: <${tag}> already registered`);
	}

	TAG_MACROS[tag] = fn;
}

export function createElement(tag, params, ...children) {
	let macro = TAG_MACROS[tag];
	return macro ? macro(params, ...children) : generateHTML(tag, params, ...children);
}
