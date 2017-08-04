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
		stream.write(`<${tag}${generateAttributes(params, tag)}>`);

		// NB:
		// * discarding blank values to avoid conditionals within JSX (passing
		//   `undefined`/`null`/`false` is much simpler)
		// * `children` might contain nested arrays due to the use of
		//   collections within JSX (`{items.map(item => <span>{item}</span>)}`)
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

export function HTMLString(str) {
	this.value = str;
}

function generateAttributes(params, tag) {
	if(!params) {
		return "";
	}

	let attribs = Object.keys(params).reduce((memo, name) => {
		let value = params[name];
		switch(value) {
		// blank attributes
		case null:
		case undefined:
			break;
		// boolean attributes (e.g. `<input … autofocus>`)
		case true:
			memo.push(name);
			break;
		case false:
			break;
		// regular attributes
		default:
			if(typeof value === "number") {
				value = value.toString();
			} else if(!value.substr) {
				abort("invalid attribute value", value, tag);
			}

			// cf. https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			if(/ |"|'|>|'|\/|=/.test(name)) {
				abort("invalid attribute name", name, tag);
			}

			memo.push(`${name}="${htmlEncode(value, true)}"`);
		}
		return memo;
	}, []);
	return attribs.length === 0 ? "" : ` ${attribs.join(" ")}`;
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

function abort(msg, value, tag) {
	msg = `${msg}: \`${JSON.stringify(value)}\``;
	if(tag) {
		msg += ` - did you perhaps forget to register \`${tag}\` as a macro?`;
	}
	throw new Error(msg);
}
