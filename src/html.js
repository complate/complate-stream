import { awaitAll, flatCompact } from "./util";

// cf. https://www.w3.org/TR/html5/syntax.html#void-elements
const VOID_ELEMENTS = {}; // poor man's set
[
	"area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
	"link", "meta", "param", "source", "track", "wbr"
].forEach(tag => {
	VOID_ELEMENTS[tag] = true;
});

// generates an "element generator" function which writes the respective HTML
// element(s) to an output stream
// that element generator expects three arguments: a writable stream¹, a flag
// permitting non-blocking I/O and a callback - the latter is invoked upon
// conclusion, without any arguments²
//
// this indirection is necessary because this function implements the signature
// expected by JSX, so not only do we need to inject additional arguments, we
// to defer element creation in order to re-align the invocation order³ - thus
// element generators operate as placeholders which are unwrapped later
//
// ¹ an object with methods `#write`, `#writeln` and `#flush`
//
// ² TODO: error handling
//
// ³ JSX is essentially a DSL for function invocations:
//
//     <foo alpha="hello" bravo="world">
//         <bar>…</bar>
//     </foo>
//
//   turns into
//
//     createElement("foo", { alpha: "hello", bravo: "world" },
//             createElement("bar", null, "…"));
//
//   without this indirection, `<bar>` would be created before `<foo>`
export default function generateHTML(tag, params, ...children) {
	return (stream, nonBlocking, callback) => {
		stream.write(`<${tag}${generateAttributes(params, tag)}>`);

		// NB:
		// * discarding blank values to avoid conditionals within JSX (passing
		//   `undefined`/`null`/`false` is much simpler)
		// * `children` might contain nested arrays due to the use of
		//   collections within JSX (`{items.map(item => <span>{item}</span>)}`)
		children = flatCompact(children);

		let total = children.length;
		if(total === 0) {
			closeElement(stream, tag, callback);
		} else {
			let close = awaitAll(total, _ => {
				closeElement(stream, tag, callback);
			});
			processChildren(stream, children, nonBlocking, close);
		}
	};
}

export function HTMLString(str) {
	this.value = str;
}

function processChildren(stream, children, nonBlocking, callback) {
	let [child, ...remainder] = children;

	if(child.call) {
		// distinguish regular element generators from deferred child elements
		if(child.length !== 1) { // XXX: arity makes for a brittle heuristic
			child(stream, nonBlocking, callback);
		} else { // deferred
			let fn = element => {
				element(stream, nonBlocking, callback);
				if(remainder.length) {
					processChildren(stream, remainder, nonBlocking, callback);
				}
			};

			if(nonBlocking) {
				child(fn);
			} else { // ensure deferred child element is synchronous
				let invoked = false;
				let _fn = fn;
				fn = function() {
					invoked = true;
					return _fn.apply(null, arguments);
				};
				child(fn);

				if(!nonBlocking && !invoked) {
					throw new Error("invalid non-blocking operation detected");
				}
			}
			return; // `remainder` processing continues recursively
		}
	} else {
		/* eslint-disable indent */
		let content = child instanceof HTMLString ? child.value :
				htmlEncode(child.toString());
		/* eslint-enable indent */
		stream.write(content);
		callback();
	}

	if(remainder.length) {
		processChildren(stream, remainder, nonBlocking, callback);
	}
}

function closeElement(stream, tag, callback) {
	if(!VOID_ELEMENTS[tag]) { // void elements must not have closing tags
		stream.write(`</${tag}>`);
	}

	stream.flush();
	callback();
};

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
