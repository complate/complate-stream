const BLANKS = [undefined, null, false];

// flatten array while discarding blank values
export function flatCompact(items) {
	return items.reduce((memo, item) => {
		return BLANKS.indexOf(item) !== -1 ? memo :
				memo.concat(item.pop ? flatCompact(item) : item);
	}, []);
}
