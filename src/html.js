import { flatCompact } from "./util";

// cf. https://www.w3.org/TR/html5/syntax.html#void-elements
const VOID_ELEMENTS = {}; // poor man's set
[
	"area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
	"link", "meta", "param", "source", "track", "wbr"
].forEach(tag => {
	VOID_ELEMENTS[tag] = true;
});

export function HTMLString(str) {
	this.value = str;
}

export default function generateHTML(tag, params, ...children) {
	return stream => {
		stream.write(`<${tag}${generateAttributes(params)}>`);

		// NB:
		// * discarding blank values to avoid conditionals within JSX (passing
		//   `null`/`undefined` is much simpler)
		// * `children` might contain nested arrays due to the use of
		//   collections within JSX (`{items.map(item => <span>item</span>)}`)
		flatCompact(children).forEach(child => {
			if(child.call) {
				child(stream);
			} else if(child instanceof HTMLString) {
				stream.write(child.value);
			} else {
				let txt = htmlEncode(child.toString());
				stream.write(txt);
			}
		});

		// void elements must not have closing tags
		if(!VOID_ELEMENTS[tag]) {
			stream.write(`</${tag}>`);
		}
		stream.flush();
	};
}

function generateAttributes(params) {
	if(!params) {
		return "";
	}

	let attribs = Object.keys(params).map(name => {
		let value = params[name];
		switch(value) {
		// blank attributes
		case null:
		case undefined:
			return;
		// boolean attributes (e.g. `<input … autofocus>`)
		case true:
			return name;
		case false:
			return;
		// regular attributes
		default:
			if(typeof value === "number") {
				value = value.toString();
			} else if(!value.substr) {
				throw new Error(`invalid attribute value: \`${JSON.stringify(value)}\``);
			}

			// cf. https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			if(/ |"|'|>|'|\/|=/.test(name)) {
				throw new Error(`invalid attribute name: \`${JSON.stringify(name)}\``);
			}

			return `${name}="${htmlEncode(value, true)}"`;
		}
	}).join(" ").trim(); // XXX: assumes blank attributes only occur at the edges
	return attribs.length === 0 ? "" : ` ${attribs}`;
}

// adapted from TiddlyWiki <http://tiddlywiki.com> and Python 3's `html` module
function htmlEncode(str, attribute) {
	let res = str.replace(/&/g, "&amp;").
		replace(/</g, "&lt;").
		replace(/>/g, "&gt;");
	if(attribute) {
		res = res.replace(/"/g, "&quot;").
			replace(/'/g, "&#x27;");
	}
	return res;
}
