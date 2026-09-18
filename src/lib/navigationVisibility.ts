export const isNavigationElementDisplayed = (element: HTMLElement) => {
	if (!element.getClientRects().length || getComputedStyle(element).visibility === 'hidden') return false;
	// Closed native details can retain layout rectangles for their hidden links.
	for (let parent = element.parentElement; parent; parent = parent.parentElement) {
		if (parent instanceof HTMLDetailsElement && !parent.open
			&& !parent.querySelector(':scope > summary')?.contains(element)) return false;
	}
	return true;
};
