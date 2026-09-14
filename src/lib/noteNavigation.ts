export const installNoteNavigation = () => {
	const revealReference = (target: HTMLElement) => {
		const panel = target.closest<HTMLElement>('[data-tab-panel]');
		if (panel?.hidden) {
			const group = panel.closest('[data-content-tabs]');
			const button = Array.from(group?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])
				.find((candidate) => candidate.getAttribute('aria-controls') === panel.id);
			button?.click();
		}
		target.focus({ preventScroll: true });
	};
	const targetFor = (hash: string) => {
		try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return null; }
	};
	document.querySelectorAll<HTMLAnchorElement>('.section-note-ref a').forEach((link) => {
		const note = targetFor(link.hash);
		if (!note?.classList.contains('section-note')) return;
		let hovered = false;
		const updateHighlight = () => {
			note.classList.toggle('is-reference-highlighted', hovered || link.matches(':focus-visible'));
		};
		link.addEventListener('pointerenter', (event) => {
			hovered = event.pointerType !== 'touch';
			updateHighlight();
		});
		link.addEventListener('pointerleave', () => {
			hovered = false;
			updateHighlight();
		});
		link.addEventListener('pointercancel', () => {
			hovered = false;
			updateHighlight();
		});
		link.addEventListener('focus', updateHighlight);
		link.addEventListener('blur', updateHighlight);
	});
	// Capture before native fragment navigation so a previously hidden reference
	// is visible and focusable when the browser follows the real return link.
	document.addEventListener('click', (event) => {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-footnote-backref]');
		if (!link) return;
		const target = targetFor(link.hash);
		if (target?.hasAttribute('data-footnote-ref')) revealReference(target);
	}, true);
	window.addEventListener('hashchange', () => {
		const target = targetFor(location.hash);
		if (target?.hasAttribute('data-footnote-ref')) revealReference(target);
	});
};
