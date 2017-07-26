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
	let fn = streamPromise => {
		streamPromise = streamPromise.then(stream => {
			stream.write(`<${tag}${generateAttributes(params)}>`);
			return stream;
		});

		// NB:
		// * discarding blank values to avoid conditionals within JSX (passing
		//   `null`/`undefined`/`false` is much simpler)
		// * `children` might contain nested arrays due to the use of
		//   collections within JSX (`{items.map(item => <span>item</span>)}`)
		flatCompact(children).forEach(child => {
			if(child.isHTMLGenerator) {
				streamPromise = child(streamPromise);
			} else if(child.then) { // Some Promise returning a isHTMLGenerator
				streamPromise = streamPromise.then(stream => {
					return child.then(elements => {
						if(!elements.isHTMLGenerator) {
							throw new Error("Expecting promise to return a HTML generator function");
						}
						return elements(Promise.resolve(stream));
					});
				});
			} else if(child.call) { // Some function returning a isHTMLGenerator
				let elements = child();
				if(!elements.isHTMLGenerator) {
					throw new Error("Expecting function to return a HTML generator function");
				}
				streamPromise = elements(streamPromise);
			} else if(child instanceof HTMLString) {
				streamPromise = streamPromise.then(stream => {
					stream.write(child.value);
					return stream;
				});
			} else {
				let txt = htmlEncode(child.toString());
				streamPromise = streamPromise.then(stream => {
					stream.write(txt);
					return stream;
				});
			}
		});

		return streamPromise.then(stream => {
			// void elements must not have closing tags
			if(!VOID_ELEMENTS[tag]) {
				stream.write(`</${tag}>`);
			}
			stream.flush();
			return stream;
		});
	};

	fn.isHTMLGenerator = true; // Tag this function to distinguish it from other functions supplied by the user
	return fn;
}

export function HTMLString(str) {
	this.value = str;
}

function generateAttributes(params) {
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
				throw new Error(`invalid attribute value: \`${JSON.stringify(value)}\``);
			}

			// cf. https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			if(/ |"|'|>|'|\/|=/.test(name)) {
				throw new Error(`invalid attribute name: \`${JSON.stringify(name)}\``);
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
