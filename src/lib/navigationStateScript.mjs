import { createNavigationStateHelpers } from './navigationState.mjs';

// Serialized into a parser-time script. Like the helpers, this entry point must
// only reference its arguments and browser globals, never module-scope values.
function restoreEarlyNavigationState(createHelpers) {
	// Restore branches as the parser adds them, before they can be painted.
	// pagereveal may precede this tree and is unavailable in some browsers.
	const script = document.currentScript;
	const container = script?.parentElement;
	if (!container?.hasAttribute('data-navigation-root')) return;
	const scope = script.dataset.navigationStateScope;
	const { storageKeys, initialState, arrivalPolicy, readEntryState, pageIsOpen, sectionsAreOpen } = createHelpers();
	const initialized = new WeakSet();
	const restore = (refresh = false) => {
		try {
			// Establish the scroll limit before restoring a position near its end.
			if (scope === 'desktop' && container.parentElement) {
				const flowTop = container.parentElement.getBoundingClientRect().top + window.scrollY;
				const stickyTop = parseFloat(getComputedStyle(container).top) || 0;
				container.style.setProperty('--navigation-scrollport-top', `${Math.ceil(Math.max(flowTop, stickyTop))}px`);
			}
			const { stateKey, sharedStateKey } = storageKeys(scope,
				container.dataset.navigationRoot, container.dataset.navigationStateRoot);
			const state = initialState(sessionStorage.getItem(stateKey), sessionStorage.getItem(sharedStateKey),
				readEntryState(stateKey));
			const policy = arrivalPolicy(state);
			for (const branch of container.querySelectorAll('.navigation-page-disclosure[data-page-path]')) {
				if (!refresh && initialized.has(branch)) continue;
				branch.open = pageIsOpen(state.disclosure, branch.dataset, policy);
				initialized.add(branch);
			}
			for (const branch of container.querySelectorAll('.navigation-page-sections-disclosure[data-page-path]')) {
				if (!refresh && initialized.has(branch)) continue;
				branch.open = sectionsAreOpen(state.disclosure, branch.dataset, policy);
				initialized.add(branch);
			}
			let scrollContainer = container;
			for (let candidate = container; candidate; candidate = candidate.parentElement) {
				if (/auto|scroll/.test(getComputedStyle(candidate).overflowY)) {
					scrollContainer = candidate;
					break;
				}
			}
			if (state.local.scrollTop > 0 || state.fromEntry) scrollContainer.scrollTop = Math.max(0, state.local.scrollTop);
			if (scope === 'desktop' && !state.fromEntry && state.local.scrollTop <= 0) {
				// A direct arrival in a short viewport can put the selected page
				// below the fold. Reveal its title now, before heading following is
				// paused. An already visible title or restored position stays put.
				const node = container.querySelector('[data-navigation-current-page="true"]');
				const link = node?.querySelector(':scope > .navigation-page-link, :scope > .navigation-page-open-link');
				if (link && link.getBoundingClientRect().width > 0) {
					const box = scrollContainer.getBoundingClientRect();
					const controls = container.querySelector('[data-tree-controls]')?.getBoundingClientRect();
					const top = Math.max(box.top, controls?.bottom ?? box.top) + 12;
					const bottom = box.bottom - 16;
					const row = link.getBoundingClientRect();
					if (row.top < top) scrollContainer.scrollTop += row.top - top;
					else if (row.bottom > bottom) scrollContainer.scrollTop += row.bottom - bottom;
				}
			}
		} catch {
			// Ordinary links and native details remain usable without storage.
		}
	};
	restore();
	const observer = new MutationObserver(() => restore());
	observer.observe(container, { childList: true, subtree: true });
	document.addEventListener('DOMContentLoaded', () => {
		restore();
		observer.disconnect();
	}, { once: true });
	// Reapply before a transition snapshot, including a cached history entry.
	window.addEventListener('pagereveal', () => restore(true));
}

export const getNavigationStateScript = () => `(${restoreEarlyNavigationState.toString()})(${createNavigationStateHelpers.toString()});`;
