import { isNavigationElementDisplayed } from './navigationVisibility';

const visibleEntry = (link: HTMLElement, container: HTMLElement): HTMLElement | undefined => {
	if (isNavigationElementDisplayed(link)) return link;

	let node = link.closest<HTMLElement>('.navigation-page-node');
	while (node && container.contains(node)) {
		const entry = node.querySelector<HTMLElement>([
			':scope > .navigation-page-link',
			':scope > .navigation-page-open-link',
			':scope > .navigation-category-disclosure > summary',
		].join(', '));
		if (entry && isNavigationElementDisplayed(entry)) return entry;
		node = node.parentElement?.closest<HTMLElement>('.navigation-page-node') ?? null;
	}
	return undefined;
};

// Adjust only the navigation scrollport, never the document or its focus.
const revealEntry = (container: HTMLElement, entry: HTMLElement) => {
	const box = container.getBoundingClientRect();
	const inset = Math.min(16, container.clientHeight / 8);
	let top = Math.max(0, box.top + container.clientTop);
	const bottom = Math.min(window.innerHeight, box.top + container.clientTop + container.clientHeight);
	for (const control of container.querySelectorAll<HTMLElement>(
		'.navigation-tree-controls, .mobile-nav-panel-actions',
	)) {
		if (isNavigationElementDisplayed(control) && getComputedStyle(control).position === 'sticky') {
			top = Math.max(top, control.getBoundingClientRect().bottom);
		}
	}
	const bounds = entry.getBoundingClientRect();
	const available = bottom - top - inset * 2;
	if (available <= 0) return;
	const delta = bounds.top < top + inset || bounds.height > available
		? bounds.top - top - inset
		: Math.max(0, bounds.bottom - bottom + inset);
	if (Math.abs(delta) > 1) {
		container.scrollTo({ top: container.scrollTop + delta, behavior: 'instant' });
	}
};

export const setupNavigationFollowing = () => {
	const left = document.querySelector<HTMLElement>('.tree-local-navigation');
	const right = document.querySelector<HTMLElement>('.page-contents-navigation-rail');
	const compact = document.querySelector<HTMLElement>('[data-compact-navigation-panel]');
	const states = [left, right, compact]
		.filter((container): container is HTMLElement => container !== null)
		.map((container) => ({
			container,
			paused: false,
			pointerDown: false,
			expectedScrollTop: container.scrollTop,
			ancestor: undefined as HTMLElement | undefined,
		}));
	let frame: number | undefined;

	const updateContainer = (state: typeof states[number], reveal: boolean) => {
		const { container } = state;
		state.ancestor?.removeAttribute('data-reading-position-ancestor');
		state.ancestor = undefined;
		if (!isNavigationElementDisplayed(container)) return;
		if (container.matches('[data-tree-filter-active="true"]')
			|| container.querySelector('[data-tree-filter-active="true"]')) return;

		const link = container.querySelector<HTMLElement>('a[aria-current="location"]');
		if (!link) return;
		const entry = visibleEntry(link, container);
		if (!entry) return;
		if (entry !== link) {
			entry.setAttribute('data-reading-position-ancestor', 'true');
			state.ancestor = entry;
		}
		if (!reveal) return;
		revealEntry(container, entry);
		state.expectedScrollTop = container.scrollTop;
	};

	const update = () => {
		frame = undefined;
		const selected = right && isNavigationElementDisplayed(right) ? right : left;
		for (const state of states) {
			const ownsFocus = state.container.contains(document.activeElement);
			updateContainer(state, state.container === selected
				&& !state.paused && !state.pointerDown && !ownsFocus
				&& !document.querySelector('.mobile-nav-menu[open]'));
		}
	};
	const schedule = () => {
		if (frame === undefined) frame = requestAnimationFrame(update);
	};

	for (const state of states) {
		const pause = () => { state.paused = true; };
		state.container.addEventListener('wheel', pause, { passive: true });
		state.container.addEventListener('touchstart', pause, { passive: true });
		state.container.addEventListener('keydown', pause);
		state.container.addEventListener('focusin', pause);
		state.container.addEventListener('input', pause);
		state.container.addEventListener('input', schedule);
		state.container.addEventListener('pointerdown', () => {
			pause();
			state.pointerDown = true;
		});
		state.container.addEventListener('scroll', () => {
			if (Math.abs(state.container.scrollTop - state.expectedScrollTop) > 1) pause();
		}, { passive: true });
		// A disclosure can hide the active link without changing the scrollport size.
		state.container.addEventListener('toggle', schedule, true);
	}
	const releasePointer = () => {
		states.forEach((state) => { state.pointerDown = false; });
	};
	document.addEventListener('pointerup', releasePointer);
	document.addEventListener('pointercancel', releasePointer);
	window.addEventListener('blur', releasePointer);
	window.addEventListener('scroll', () => {
		states.forEach((state) => { state.paused = false; });
		// Section tracking schedules its own update for the new document position.
	}, { passive: true });
	window.addEventListener('resize', schedule);
	if ('ResizeObserver' in window) {
		const observer = new ResizeObserver(schedule);
		states.forEach(({ container }) => observer.observe(container));
	}

	return {
		update: schedule,
		revealCompact: () => {
			const state = states.find(({ container }) => container === compact);
			if (state) updateContainer(state, true);
		},
	};
};
