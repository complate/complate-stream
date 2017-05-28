// flatten array while discarding blank values
export function flatCompact(items) {
	return items.reduce((memo, item) => {
		return item === null || item === undefined ? memo :
				memo.concat(item.pop ? flatCompact(item) : item);
	}, []);
}
