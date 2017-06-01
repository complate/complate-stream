import { flatCompact } from "./util";

// cf. https://www.w3.org/TR/html5/syntax.html#void-elements
const VOID_ELEMENTS = {}; // poor man's set
[
	"area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
	"link", "meta", "param", "source", "track", "wbr"
].forEach(tag => {
	VOID_ELEMENTS[tag] = true;
});

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

	return " " + Object.keys(params).map(name => {
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
			value = value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

			return `${name}="${value}"`;
		}
	}).join(" ");
}

// adapted from TiddlyWiki <http://tiddlywiki.com>
function htmlEncode(str) { // XXX: insufficient?
	return str.replace(/&/g, "&amp;").
		replace(/</g, "&lt;").
		replace(/>/g, "&gt;").
		replace(/"/g, "&quot;");
}
