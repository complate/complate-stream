import { simpleLog, awaitAll, flatCompact } from "./util";

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
	return (stream, { nonBlocking, log = simpleLog, idRegistry = {} }, callback) => {
		stream.write(`<${tag}${generateAttributes(params, { log, idRegistry, tag })}>`);

		// NB:
		// * discarding blank values to avoid conditionals within JSX (passing
		//   `undefined`/`null`/`false` is much simpler)
		// * `children` might contain nested arrays due to the use of
		//   collections within JSX (`{items.map(item => <span>{item}</span>)}`)
		children = flatCompact(children);

		let isVoid = VOID_ELEMENTS[tag];
		let closingTag = isVoid ? null : tag;
		let total = children.length;
		if(total === 0) {
			closeElement(stream, closingTag, callback);
		} else {
			if(isVoid) {
				log("error", `void elements must not have children: \`<${tag}>\``);
			}

			let close = awaitAll(total, _ => {
				closeElement(stream, closingTag, callback);
			});
			processChildren(stream, children,
					{ nonBlocking, log, idRegistry, tag }, close);
		}
	};
}

export function HTMLString(str) {
	this.value = str;
}

// adapted from TiddlyWiki <http://tiddlywiki.com> and Python 3's `html` module
export function htmlEncode(str, attribute) {
	let res = str.replace(/&/g, "&amp;").
		replace(/</g, "&lt;").
		replace(/>/g, "&gt;");
	if(attribute) {
		res = res.replace(/"/g, "&quot;").
			replace(/'/g, "&#x27;");
	}
	return res;
}

function processChildren(stream, children, options, callback) {
	let [child, ...remainder] = children;

	if(child.call) {
		let { nonBlocking, log, idRegistry } = options;
		let generatorOptions = { nonBlocking, log, idRegistry };
		// distinguish regular element generators from deferred child elements
		if(child.length !== 1) { // element generator -- XXX: brittle heuristic (arity)
			child(stream, generatorOptions, callback);
		} else { // deferred child element
			let fn = element => {
				element(stream, generatorOptions, callback);
				if(remainder.length) {
					processChildren(stream, remainder, options, callback);
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
					let msg = "invalid non-blocking operation detected";
					throw new Error(`${msg}: \`${options.tag}\``);
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
		processChildren(stream, remainder, options, callback);
	}
}

function closeElement(stream, tag, callback) {
	if(tag !== null) { // void elements must not have closing tags
		stream.write(`</${tag}>`);
	}

	stream.flush();
	callback();
};

function generateAttributes(params, { log, idRegistry, tag }) {
	if(!params) {
		return "";
	}

	if(idRegistry && params.id !== undefined) {
		let { id } = params;
		if(idRegistry[id]) {
			log("error", `duplicate HTML element ID: ${repr(params.id)}`);
		}
		idRegistry[id] = true;
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
			// cf. https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			if(/ |"|'|>|'|\/|=/.test(name)) {
				reportAttribError(`invalid HTML attribute name: ${repr(name)}`, tag, log);
				break;
			}

			if(typeof value === "number") {
				value = value.toString();
			} else if(!value.substr) {
				reportAttribError(`invalid value for HTML attribute \`${name}\`: ` +
						`${repr(value)} (expected string)`, tag, log);
				break;
			}

			memo.push(`${name}="${htmlEncode(value, true)}"`);
		}
		return memo;
	}, []);
	return attribs.length === 0 ? "" : ` ${attribs.join(" ")}`;
}

function reportAttribError(msg, tag, log) {
	log("error", `${msg} - did you perhaps intend to use \`${tag}\` as a macro?`);
}

function repr(value) {
	return `\`${JSON.stringify(value)}\``;
}
