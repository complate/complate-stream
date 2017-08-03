import generateHTML from "./html";
import { flatCompact } from "./util";

const TAG_MACROS = {};

export default function documentRenderer(doctype = "<!DOCTYPE html>") {
	return (stream, tag, params) => {
		stream.writeln(doctype);
		createElement(tag, params)(stream);
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
	return macro ? macro(params, ...flatCompact(children)) :
			generateHTML(tag, params, ...children);
}
