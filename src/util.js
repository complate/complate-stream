const BLANKS = [undefined, null, false];

// flatten array while discarding blank values
export function flatCompact(items) {
	return items.reduce((memo, item) => {
		return BLANKS.includes(item) ? memo :
				memo.concat(item.pop ? flatCompact(item) : item);
	}, []);
}
