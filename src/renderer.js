import generateHTML from "./html";
import { flatCompact, noop } from "./util";

export default function documentRenderer(doctype = "<!DOCTYPE html>") {
	return (stream, tag, params, callback) => {
		if(doctype) {
			stream.writeln(doctype);
		}
		let element = createElement(tag, params);

		if(callback) { // non-blocking mode
			element(stream, true, callback);
		} else { // blocking mode
			element(stream, false, noop);
		}
	};
}

// distinguishes regular tags from macros
export function createElement(element, params, ...children) {
	/* eslint-disable indent */
	return element.call ?
			element(params, ...flatCompact(children)) :
			generateHTML(element, params, ...children);
	/* eslint-enable indent */
}
