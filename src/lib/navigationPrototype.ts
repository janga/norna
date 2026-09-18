type Prefetch = (url: string) => void;

const visible = (element: HTMLElement) => {
	if (!element.getClientRects().length || getComputedStyle(element).visibility === 'hidden') return false;
	for (let parent = element.parentElement; parent; parent = parent.parentElement) {
		if (parent instanceof HTMLDetailsElement && !parent.open
			&& !parent.querySelector(':scope > summary')?.contains(element)) return false;
	}
	return true;
};

const setupTreeScrollport = () => {
	const tree = document.querySelector<HTMLElement>('.tree-local-navigation');
	const layout = tree?.parentElement;
	if (!tree || !layout) return;
	const update = () => {
		if (!tree.getClientRects().length) return;
		// Notices above the layout can place the tree below its sticky offset.
		// Reserve that space even after document scrolling, so the tree does not
		// resize and move its rows while the reader scrolls the article.
		const flowTop = layout.getBoundingClientRect().top + window.scrollY;
		const stickyTop = parseFloat(getComputedStyle(tree).top) || 0;
		tree.style.setProperty('--navigation-scrollport-top', `${Math.ceil(Math.max(flowTop, stickyTop))}px`);
	};
	const observer = new ResizeObserver(update);
	for (const element of document.querySelectorAll('.site-top, .site-banners')) observer.observe(element);
	window.addEventListener('resize', update);
	window.addEventListener('pageshow', update);
	void document.fonts.ready.then(update);
	update();
};

const setupDisclosures = (reducedMotion: MediaQueryList) => {
	const finishers = new Set<() => void>();
	for (const details of document.querySelectorAll<HTMLDetailsElement>(
		'.navigation-page-disclosure, .navigation-page-sections-disclosure',
	)) {
		const summary = details.querySelector<HTMLElement>(':scope > summary');
		const contentId = summary?.getAttribute('aria-controls');
		const content = contentId ? document.getElementById(contentId) : null;
		if (!summary || !content) continue;
		let animation: Animation | null = null;
		let destination = details.open;
		const originallyInert = content.inert;
		const finish = () => {
			details.open = destination;
			animation?.cancel();
			animation = null;
			content.inert = originallyInert;
			content.removeAttribute('data-navigation-motion-active');
			details.removeAttribute('data-navigation-motion-open');
			summary.removeAttribute('aria-expanded');
			finishers.delete(finish);
		};
		summary.addEventListener('click', (event) => {
			if (event.defaultPrevented || reducedMotion.matches || typeof content.animate !== 'function') return;
			if (event.target instanceof Element && event.target.closest('a')) return;
			event.preventDefault();
			const height = visible(content) ? content.getBoundingClientRect().height : 0;
			const opacity = height ? getComputedStyle(content).opacity : '0';
			destination = animation ? !destination : !details.open;
			animation?.cancel();
			if (!destination && content.contains(document.activeElement)) summary.focus({ preventScroll: true });
			details.open = true;
			const fullHeight = content.getBoundingClientRect().height;
			content.inert = !destination || originallyInert;
			content.setAttribute('data-navigation-motion-active', '');
			details.dataset.navigationMotionOpen = String(destination);
			summary.setAttribute('aria-expanded', String(destination));
			animation = content.animate([
				{ height: `${height}px`, opacity },
				{ height: `${destination ? fullHeight : 0}px`, opacity: destination ? '1' : '0' },
			], {
				duration: 180,
				easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				fill: 'both',
			});
			animation.onfinish = finish;
			finishers.add(finish);
		});
	}
	const finishAll = () => {
		for (const finish of finishers) finish();
	};
	reducedMotion.addEventListener('change', () => {
		if (reducedMotion.matches) finishAll();
	});
	window.addEventListener('pagehide', finishAll, { capture: true });
	// Let filtering and the existing tree controls act on settled disclosure state.
	for (const event of ['click', 'input']) {
		document.addEventListener(event, (event) => {
			if (event.target instanceof Element && event.target.closest('[data-tree-controls]')) finishAll();
		}, { capture: true });
	}
};

const setupOutlineMarkers = () => {
	const outlines = [...document.querySelectorAll<HTMLOListElement>('.page-contents-links')];
	let frame: number | undefined;
	const update = () => {
		frame = undefined;
		for (const outline of outlines) {
			const current = outline.querySelector<HTMLElement>('a[aria-current="location"]');
			if (!current || !visible(current)) {
				outline.style.setProperty('--navigation-marker-opacity', '0');
				continue;
			}
			const initial = !outline.hasAttribute('data-navigation-marker');
			outline.setAttribute('data-navigation-marker', '');
			if (initial) outline.setAttribute('data-navigation-marker-initial', '');
			const bounds = current.getBoundingClientRect();
			const style = getComputedStyle(current);
			const paddingTop = parseFloat(style.paddingTop);
			const paddingBottom = parseFloat(style.paddingBottom);
			outline.style.setProperty('--navigation-marker-top', `${bounds.top + paddingTop - outline.getBoundingClientRect().top}px`);
			outline.style.setProperty('--navigation-marker-height', `${bounds.height - paddingTop - paddingBottom}px`);
			outline.style.setProperty('--navigation-marker-opacity', '1');
			if (initial) requestAnimationFrame(() => outline.removeAttribute('data-navigation-marker-initial'));
		}
	};
	const schedule = () => { frame ??= requestAnimationFrame(update); };
	new MutationObserver(schedule).observe(document.body, {
		subtree: true,
		attributes: true,
		attributeFilter: ['aria-current', 'open', 'hidden'],
	});
	const observer = new ResizeObserver(schedule);
	for (const outline of outlines) observer.observe(outline);
	window.addEventListener('resize', schedule);
	window.addEventListener('pageshow', schedule);
	schedule();
};

const setupScrollArrival = () => {
	const root = document.documentElement;
	const originalHash = location.hash;
	let interrupted = false;
	const interrupt = () => { interrupted = true; };
	for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
		window.addEventListener(event, interrupt, { once: true, passive: true });
	}
	const ready = async (restoreHistory: boolean) => {
		await document.fonts.ready;
		requestAnimationFrame(() => requestAnimationFrame(() => {
			if (!restoreHistory && !interrupted && originalHash && location.hash === originalHash) {
				try {
					const target = document.getElementById(decodeURIComponent(originalHash.slice(1)));
					const header = document.querySelector<HTMLElement>('.site-top');
					if (target) {
						const offset = Math.ceil(header?.getBoundingClientRect().height ?? 0);
						window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset, behavior: 'instant' });
					}
				} catch {
					// Leave malformed URL fragments to the browser's native handling.
				}
			}
			root.style.scrollBehavior = 'smooth';
			root.setAttribute('data-navigation-motion-ready', '');
		}));
	};
	window.addEventListener('pageswap', () => root.removeAttribute('data-navigation-motion-ready'));
	window.addEventListener('pageshow', (event) => {
		if (event.persisted) void ready(true);
	});
	const initialReady = () => {
		const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
		void ready(navigation?.type === 'back_forward');
	};
	if (document.readyState === 'complete') initialReady();
	else window.addEventListener('load', initialReady, { once: true });
};

const setupIntentPrefetch = (prefetch: Prefetch) => {
	const basePath = document.documentElement.dataset.navigationPrototype ?? '/';
	let timer: number | undefined;
	let pending: HTMLAnchorElement | null = null;
	const eligible = (target: EventTarget | null) => {
		const link = target instanceof Element ? target.closest<HTMLAnchorElement>('a[href]') : null;
		if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return null;
		const url = new URL(link.href, location.href);
		if (url.origin !== location.origin || !url.pathname.startsWith(basePath) || url.search) return null;
		if (!url.pathname.endsWith('/') || url.pathname === location.pathname) return null;
		return link;
	};
	const cancel = () => {
		window.clearTimeout(timer);
		pending = null;
	};
	const prepare = (event: Event) => {
		const link = eligible(event.target);
		if (link === pending) return;
		cancel();
		if (!link) return;
		pending = link;
		timer = window.setTimeout(() => {
			prefetch(link.href);
		}, 100);
	};
	document.addEventListener('pointerover', prepare, { passive: true });
	document.addEventListener('focusin', prepare);
	document.addEventListener('pointerout', (event) => {
		if (pending && !(event.relatedTarget instanceof Node && pending.contains(event.relatedTarget))) cancel();
	}, { passive: true });
	document.addEventListener('focusout', cancel);
	window.addEventListener('pagehide', cancel);
};

export const setupNavigationPrototype = (prefetch: Prefetch) => {
	const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
	setupTreeScrollport();
	setupDisclosures(reducedMotion);
	setupOutlineMarkers();
	setupScrollArrival();
	setupIntentPrefetch(prefetch);
};
