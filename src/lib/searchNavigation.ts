type SearchOrigin = {
	id: string;
	href: string;
	title: string;
	x: number;
	y: number;
};

const returnParameter = 'norna-return';
const historyKey = 'nornaSearchOrigin';

export const setupSearchNavigation = () => {
	const searchLink = document.querySelector<HTMLAnchorElement>('.site-search-link[data-search-base]');
	if (!searchLink) return;
	const basePath = searchLink.dataset.searchBase!;
	const searchUrl = new URL(searchLink.href);
	const departureKey = `norna:search:${basePath}:departure`;
	const restoreKey = `norna:search:${basePath}:restore`;
	const localHref = () => location.pathname + location.search + location.hash;
	const isNormalClick = (event: MouseEvent, link: HTMLAnchorElement) => !event.defaultPrevented
		&& event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
		&& !link.hasAttribute('download') && (!link.target || link.target === '_self');
	const readStorage = (key: string): unknown => {
		try { return JSON.parse(sessionStorage.getItem(key) ?? 'null'); } catch { return null; }
	};
	const store = (key: string, value: SearchOrigin) => {
		try { sessionStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
	};
	const remove = (key: string) => {
		try { sessionStorage.removeItem(key); } catch {}
	};
	const validate = (value: unknown): SearchOrigin | null => {
		if (!value || typeof value !== 'object') return null;
		const origin = value as SearchOrigin;
		if (typeof origin.id !== 'string' || !/^[a-z0-9-]{1,100}$/i.test(origin.id)
			|| typeof origin.href !== 'string' || !origin.href.startsWith('/')
			|| origin.href.startsWith('//') || /[\\\u0000-\u0020]/.test(origin.href)
			|| typeof origin.title !== 'string' || !origin.title.trim() || origin.title.length > 1000
			|| !Number.isFinite(origin.x) || origin.x < 0
			|| !Number.isFinite(origin.y) || origin.y < 0) return null;
		try {
			const url = new URL(origin.href, location.origin);
			if (url.origin !== location.origin || !url.pathname.startsWith(basePath)
				|| url.pathname === searchUrl.pathname) return null;
			return origin;
		} catch { return null; }
	};

	document.addEventListener('click', (event) => {
		const title = searchLink.dataset.searchSourceTitle;
		const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
		if (!title || !link || !isNormalClick(event, link)
			|| link.origin !== searchUrl.origin || link.pathname !== searchUrl.pathname) return;
		const origin: SearchOrigin = {
			id: crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
			href: localHref(), title, x: Math.max(0, scrollX), y: Math.max(0, scrollY),
		};
		if (!store(departureKey, origin)) return;
		try { history.replaceState({ ...history.state, [historyKey]: origin }, ''); } catch {}
		const destination = new URL(link.href);
		destination.searchParams.set(returnParameter, origin.id);
		event.preventDefault();
		location.assign(destination.href);
	});

	const returnLink = document.querySelector<HTMLAnchorElement>('[data-search-return]');
	if (returnLink) {
		const url = new URL(location.href);
		const token = url.searchParams.get(returnParameter);
		let origin = validate(history.state?.[historyKey]);
		if (url.searchParams.has(returnParameter)) {
			const departure = validate(readStorage(departureKey));
			origin = departure?.id === token ? departure : null;
			url.searchParams.delete(returnParameter);
			// Keep return context on this history entry, not on subsequent direct visits.
			try {
				history.replaceState({ ...history.state, [historyKey]: origin }, '', url);
			} catch { origin = null; }
			if (departure?.id === token) remove(departureKey);
		}
		if (origin) {
			const destination = origin;
			returnLink.href = destination.href;
			returnLink.querySelector('span')!.textContent = returnLink.dataset.searchReturnLabel!.replace('{page}', () => destination.title);
			returnLink.addEventListener('click', (event) => {
				if (isNormalClick(event, returnLink)) store(restoreKey, destination);
			});
		}
		return;
	}

	const restore = (event: PageTransitionEvent) => {
		const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
		const fromHistory = event.persisted || navigation?.type === 'back_forward';
		const origin = validate(readStorage(restoreKey))
			?? (fromHistory ? validate(history.state?.[historyKey]) : null);
		remove(restoreKey);
		if (!origin || origin.href !== localHref()) return;
		try { history.replaceState({ ...history.state, [historyKey]: null }, ''); } catch {}
		// Wait for initial anchor alignment and font layout, then restore the actual reading position.
		void document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
			searchLink.focus({ preventScroll: true });
			window.scrollTo({ left: origin.x, top: origin.y, behavior: 'instant' });
		})));
	};
	window.addEventListener('pageshow', restore);
};
