export const getTreeNavigationVisibilityScript = ({ storageKey }) => `(() => {
	const root = document.documentElement;
	const storageKey = ${JSON.stringify(storageKey)};
	let state = 'expanded';

	try {
		state = sessionStorage.getItem(storageKey) === 'collapsed' ? 'collapsed' : 'expanded';
	} catch {}

	root.dataset.treeNavigation = state;
	root.dataset.treeNavigationReady = 'true';

	const setup = () => {
		const button = document.querySelector('[data-tree-navigation-toggle]');
		const navigationId = button?.getAttribute('aria-controls');
		const navigation = navigationId ? document.getElementById(navigationId) : null;
		if (!(button instanceof HTMLButtonElement) || !(navigation instanceof HTMLElement)) return;

		const hideLabel = button.dataset.hideLabel ?? 'Hide navigation';
		const showLabel = button.dataset.showLabel ?? 'Show navigation';
		const apply = (nextState, persist = false) => {
			const expanded = nextState !== 'collapsed';
			state = expanded ? 'expanded' : 'collapsed';
			root.dataset.treeNavigation = state;
			button.setAttribute('aria-expanded', String(expanded));
			button.setAttribute('aria-label', expanded ? hideLabel : showLabel);
			button.title = expanded ? hideLabel : showLabel;
			navigation.hidden = !expanded;

			if (persist) {
				try {
					sessionStorage.setItem(storageKey, state);
				} catch {}
			}
		};

		apply(state);
		button.addEventListener('click', () => {
			apply(button.getAttribute('aria-expanded') === 'true' ? 'collapsed' : 'expanded', true);
		});
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setup, { once: true });
	} else {
		setup();
	}
})();`;
