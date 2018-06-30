let BLANKS = [undefined, null, false];

export function simpleLog(type, msg) {
	console.log(`[${type}] ${msg}`); // eslint-disable-line no-console
}

// returns a function that invokes `callback` only after having itself been
// invoked `total` times
export function awaitAll(total, callback) {
	let i = 0;
	return _ => {
		i++;
		if(i === total) {
			callback();
		}
	};
}

// flattens array while discarding blank values
export function flatCompact(items) {
	return items.reduce((memo, item) => {
		return BLANKS.indexOf(item) !== -1 ? memo : // eslint-disable-next-line indent
				memo.concat(item.pop ? flatCompact(item) : item);
	}, []);
}

export function blank(value) {
	return BLANKS.indexOf(value) !== -1;
}

export function repr(value, jsonify = true) {
	return `\`${jsonify ? JSON.stringify(value) : value}\``;
}

export function noop() {}
