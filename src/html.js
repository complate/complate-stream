import { simpleLog, awaitAll, flatCompact, blank, repr } from "./util";

export let Fragment = {}; // poor man's symbol; used for virtual wrapper elements

// cf. https://www.w3.org/TR/html5/syntax.html#void-elements
let VOID_ELEMENTS = {}; // poor man's `Set`
[
	"area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
	"link", "meta", "param", "source", "track", "wbr"
].forEach(tag => {
	VOID_ELEMENTS[tag] = true;
});

let HTML_ENTITIES = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#x27;"
};

// generates an "element generator" function which serves as a placeholder and,
// when invoked, writes the respective HTML to an output stream
//
// such an element generator expects three arguments:
// * a writable stream (an object with methods `#write`, `#writeln` and `#flush`)
// * an options object:
//     * `nonBlocking`, if truthy, permits non-blocking I/O
//     * `log` is a logging function with the signature `(level, message)`; note
//       that violations of HTML semantics are logged as "error", though user
//       agents might still successfully render the respective document
// * a callback function which is invoked upon conclusion, without any arguments
//
// the indirection via element generators serves two purposes: since this
// function implements the signature expected by JSX (which is essentially a DSL
// for function invocations), we need to inject additional arguments by other
// means - plus we need to defer element creation in order to ensure proper
// order and nesting:
//
//     <body id="top">
//         <h1>hello world</h1>
//     </body>
//
// turns into
//
//     createElement("body", { id: "top" },
//             createElement("h1", null, "hello world"));
//
// without a thunk-style indirection, `<h1>` would be created before `<body>`
export default function generateHTML(tag, params, ...children) {
	return (stream, options, callback) => {
		let { nonBlocking, log = simpleLog, _idRegistry = {} } = options || {};
		if(tag !== Fragment) {
			let attribs = generateAttributes(params, { tag, log, _idRegistry });
			stream.write(`<${tag}${attribs}>`);
		}

		// NB:
		// * discarding blank values (`undefined`, `null`, `false`) to allow for
		//   conditionals with boolean operators (`condition && value`)
		// * `children` might contain nested arrays due to the use of
		//   collections within JSX (`{items.map(item => <span>{item}</span>)}`)
		children = flatCompact(children);

		let isVoid = VOID_ELEMENTS[tag];
		let closingTag = (isVoid || tag === Fragment) ? null : tag;
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
			processChildren(stream, children, 0,
					{ tag, nonBlocking, log, _idRegistry }, close);
		}
	};
}

export function HTMLString(str) {
	if(blank(str) || !str.substr) {
		throw new Error(`invalid ${repr(this.constructor.name, false)}: ${repr(str)}`);
	}
	this.value = str;
}

// adapted from html-entities <https://github.com/mdevils/html-entities> (MIT license)
export function htmlEncode(str, attribute) {
	let pattern = attribute ? /[&<>'"]/g : /[&<>]/g;
	let match = pattern.exec(str);
	if(!match) {
		return str;
	}

	let res = "";
	let last = 0;
	do {
		let { index } = match;
		if(last !== index) {
			res += str.substring(last, index);
		}
		res += HTML_ENTITIES[match[0]];
		last = pattern.lastIndex;
	} while((match = pattern.exec(str)));

	if(last !== str.length) {
		res += str.substring(last);
	}
	return res;
}

function processChildren(stream, children, startIndex, options, callback) {
	for(let i = startIndex; i < children.length; i++) {
		let child = children[i];

		if(!child.call) { // leaf node(s)
			let content = child instanceof HTMLString ? // eslint-disable-next-line indent
					child.value : htmlEncode(child.toString());
			stream.write(content);
			callback();
			continue;
		}

		let { nonBlocking, log, _idRegistry } = options;
		let generatorOptions = { nonBlocking, log, _idRegistry };
		if(child.length !== 1) { // element generator -- XXX: brittle heuristic (arity)
			child(stream, generatorOptions, callback);
			continue;
		}

		// deferred child element
		let fn = element => {
			element(stream, generatorOptions, callback);
			let next = i + 1;
			if(next < children.length) {
				processChildren(stream, children, next, options, callback);
			}
		};

		if(!nonBlocking) { // ensure deferred child element is synchronous
			let invoked = false;

			let _fn = fn;
			fn = function() {
				invoked = true;
				return _fn.apply(null, arguments);
			};

			let _child = child;
			child = function() {
				let res = _child.apply(null, arguments);
				if(!invoked) {
					let msg = "invalid non-blocking operation detected";
					throw new Error(`${msg}: \`${options.tag}\``);
				}
				return res;
			};
		}

		child(fn);
		break; // remainder processing continues recursively above
	}
}

function closeElement(stream, tag, callback) {
	if(tag !== null) { // void elements must not have closing tags
		stream.write(`</${tag}>`);
	}

	stream.flush();
	callback();
}

function generateAttributes(params, { tag, log, _idRegistry }) {
	if(!params) {
		return "";
	}

	if(_idRegistry && params.id !== undefined) {
		let { id } = params;
		if(_idRegistry[id]) {
			log("error", `duplicate HTML element ID: ${repr(params.id)}`);
		}
		_idRegistry[id] = true;
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
			if(/[ "'>/=]/.test(name)) {
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
