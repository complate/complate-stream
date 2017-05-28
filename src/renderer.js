import generateHTML from "./html";

const CUSTOM_ELEMENTS = {};

export default function documentRenderer(doctype = "<!DOCTYPE html>") {
	return (stream, element, params) => {
		stream.writeln(doctype);
		createElement(element, params)(stream);
	};
}

export function registerElement(tag, fn) {
	if(tag.indexOf("-") === -1) {
		raise(tag, "must contain a hyphen");
	}

	if(CUSTOM_ELEMENTS[tag]) {
		raise(tag, "already registered");
	}

	CUSTOM_ELEMENTS[tag] = fn;
}

export function createElement(tag, params, ...children) {
	if(tag.indexOf("-") === -1) { // regular element
		return generateHTML(tag, params, ...children);
	}

	// custom element
	let fn = CUSTOM_ELEMENTS[tag];
	if(!fn) {
		raise(tag);
	}
	return fn(params, ...children);
}

function raise(tag, msg) {
	let err = `invalid custom element: <${tag}>`;
	throw new Error(msg ? `${err} ${msg}` : err);
}
