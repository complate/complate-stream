import generateHTML from "./html";
import { flatCompact } from "./util";

const TAG_MACROS = {};

export default function documentRenderer(doctype = "<!DOCTYPE html>") {
	return (stream, element, params, ...children) => {
		let p = Promise.resolve(stream).
			then(stream => {
				stream.writeln(doctype);
				return stream;
			});
		return createElement(element, params, ...children)(p);
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
