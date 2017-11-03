const BLANKS = [undefined, null, false];

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
		/* eslint-disable indent */
		return BLANKS.indexOf(item) !== -1 ? memo :
				memo.concat(item.pop ? flatCompact(item) : item);
		/* eslint-enable indent */
	}, []);
}

export function noop() {}
