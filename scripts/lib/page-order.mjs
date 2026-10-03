// One ordering contract for source discovery, placement and presentation.
export const pageOrderSpacing = 1000;
export const maximumPageOrder = Number.MAX_SAFE_INTEGER;

export const parsePageOrder = (value, label = 'navigation.order') => {
	if (value === undefined || value === null) return null;
	if (!Number.isSafeInteger(value) || value < 1) {
		throw new Error(`${label} must be a positive safe integer (1–${maximumPageOrder}).`);
	}
	return value;
};

export const comparePageOrder = (left, right) => {
	const a = left.pageOrder ?? null, b = right.pageOrder ?? null;
	return (a === null ? b === null ? 0 : 1 : b === null ? -1 : a - b)
		|| (left.pageId < right.pageId ? -1 : left.pageId > right.pageId ? 1 : 0);
};

// Siblings exclude the inserted page and are already in presentation order.
export const planPageOrder = (siblings, index) => {
	if (!Number.isInteger(index) || index < 0 || index > siblings.length) throw new Error('Invalid page insertion position.');
	const before = index === 0 ? 0 : siblings[index - 1].pageOrder;
	const after = siblings[index]?.pageOrder ?? null;
	let order = null;
	if (before !== null && before !== undefined) {
		if (after !== null && after - before > 1) order = before + Math.floor((after - before) / 2);
		else if (after === null && before <= maximumPageOrder - pageOrderSpacing) order = before + pageOrderSpacing;
	}
	if (order !== null) return { order, orderChanges: [] };
	if (siblings.length + 1 > Math.floor(maximumPageOrder / pageOrderSpacing)) throw new Error('Too many siblings to assign safe page order values.');
	const orderChanges = siblings.flatMap((node, position) => {
		const newOrder = (position + (position >= index ? 2 : 1)) * pageOrderSpacing;
		return node.pageOrder === newOrder ? [] : [{ node, oldOrder: node.pageOrder, newOrder }];
	});
	return { order: (index + 1) * pageOrderSpacing, orderChanges };
};

export const describeRenumbering = (changes, displayPath = value => value) => changes.length ? [
	`This placement requires new order values for ${changes.length} existing sibling page(s). Their content.md files will be updated:`,
	...changes.map(change => `- ${displayPath(change.contentPath ?? change.node.contentPath)}: ${change.oldOrder ?? 'unset'} → ${change.newOrder}`),
].join('\n') : '';

export const assertRenumberingAllowed = (changes, allowRenumber) => {
	if (changes.length && allowRenumber !== true) throw new Error('Renumbering existing sibling pages requires confirmation. Review the plan; use --allow-renumber for unattended commands. No files changed.');
};
