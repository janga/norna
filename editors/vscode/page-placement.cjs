const pageParent = (page) => {
	let parent = page?.parent;
	while (parent && parent.kind !== 'page') parent = parent.parent;
	return parent;
};

const isWithin = (page, possibleAncestor) => {
	for (let current = page; current; current = pageParent(current)) if (current.id === possibleAncestor.id) return true;
	return false;
};

function previewPlacement(source, target, placement, pages) {
	const inside = placement === 'first' || placement === 'last';
	const parent = inside ? target : pageParent(target);
	if (!parent || isWithin(parent, source)) throw new Error('A page cannot move into its own branch. Choose another target.');
	const originalParent = pageParent(source);
	const sameParent = originalParent.id === parent.id;
	const siblings = pages.filter((page) => pageParent(page)?.id === parent.id && page.id !== source.id);
	const targetIndex = siblings.findIndex((page) => page.id === target.id);
	const index = placement === 'first' ? 0 : placement === 'last' ? siblings.length
		: targetIndex + (placement === 'after' ? 1 : 0);
	if (!inside && targetIndex < 0) throw new Error('The target page is no longer in this site. Refresh Site Tree and try again.');
	const oldIndex = pages.filter((page) => pageParent(page)?.id === originalParent.id)
		.findIndex((page) => page.id === source.id);
	const slug = source.url.split('/').filter(Boolean).at(-1);
	const newUrl = `${parent.url}${slug}/`;
	const descendantCount = pages.filter((page) => page.id !== source.id && isWithin(page, source)).length;
	const conflict = pages.find((page) => page.id !== source.id && !isWithin(page, source) && page.url === newUrl);
	return { parent, index, sameParent, unchanged: sameParent && oldIndex === index,
		newUrl, descendantCount, conflict, sourceUrl: source.url };
}

function describePlacement(source, target, placement, preview) {
	const position = placement === 'before' ? `before “${target.title}”` : placement === 'after' ? `after “${target.title}”`
		: placement === 'first' ? `first under “${target.title}”` : `last under “${target.title}”`;
	const url = preview.sameParent ? `URL remains ${source.url}.` : `URL: ${source.url} → ${preview.newUrl}.`;
	const descendants = preview.descendantCount ? ` ${preview.descendantCount} descendant page(s) would move too.` : '';
	return `“${source.title}” ${position}. ${url}${descendants}`;
}

module.exports = { pageParent, isWithin, previewPlacement, describePlacement };
