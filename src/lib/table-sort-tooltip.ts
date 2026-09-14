export const createTableSortTooltip = () => {
	const tooltip = document.createElement('div');
	tooltip.id = 'norna-table-sort-tooltip';
	tooltip.className = 'norna-table-sort-tooltip';
	tooltip.setAttribute('role', 'tooltip');
	tooltip.hidden = true;
	document.body.append(tooltip);
	let owner: HTMLButtonElement | null = null;
	let openTimer: ReturnType<typeof setTimeout> | undefined;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	const setDescription = (button: HTMLButtonElement, enabled: boolean) => {
		const ids = new Set((button.getAttribute('aria-describedby') ?? '').split(/\s+/u).filter(Boolean));
		if (enabled) ids.add(tooltip.id);
		else ids.delete(tooltip.id);
		if (ids.size) button.setAttribute('aria-describedby', [...ids].join(' '));
		else button.removeAttribute('aria-describedby');
	};
	const hide = () => {
		clearTimeout(openTimer);
		clearTimeout(closeTimer);
		if (owner) setDescription(owner, false);
		owner = null;
		tooltip.hidden = true;
	};
	const position = () => {
		if (!owner || tooltip.hidden) return;
		const bounds = owner.getBoundingClientRect();
		const tip = tooltip.getBoundingClientRect();
		const width = document.documentElement.clientWidth;
		const height = window.innerHeight;
		const left = Math.max(8, Math.min(width - tip.width - 8, bounds.left + (bounds.width - tip.width) / 2));
		const below = bounds.bottom + 4;
		const top = below + tip.height <= height - 8 ? below : Math.max(8, bounds.top - tip.height - 4);
		tooltip.style.left = `${left}px`;
		tooltip.style.top = `${top}px`;
	};
	const refresh = (button: HTMLButtonElement) => {
		if (button !== owner || tooltip.hidden) return;
		tooltip.textContent = button.dataset.tableSortAction ?? '';
		position();
	};
	const show = (button: HTMLButtonElement, delay: number) => {
		if (button === owner && !tooltip.hidden) {
			clearTimeout(closeTimer);
			return;
		}
		hide();
		owner = button;
		const open = () => {
			if (!button.isConnected || button.closest('[inert]') || button.getAttribute('aria-hidden') === 'true') {
				hide();
				return;
			}
			tooltip.hidden = false;
			setDescription(button, true);
			refresh(button);
		};
		if (delay === 0) open();
		else openTimer = setTimeout(open, delay);
	};
	const scheduleHide = () => {
		clearTimeout(openTimer);
		clearTimeout(closeTimer);
		// Allow the pointer to cross the small gap into the tooltip.
		closeTimer = setTimeout(() => {
			if (!tooltip.matches(':hover') && !owner?.matches(':hover, :focus-visible')) hide();
		}, 120);
	};
	tooltip.addEventListener('pointerenter', () => clearTimeout(closeTimer));
	tooltip.addEventListener('pointerleave', scheduleHide);
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && owner) {
			hide();
			event.preventDefault();
		}
	});
	document.addEventListener('scroll', () => {
		// Keyboard focus may scroll a clipped heading into view after opening its tip.
		if (owner?.matches(':focus-visible')) {
			const bounds = owner.getBoundingClientRect();
			if (bounds.bottom > 0 && bounds.top < window.innerHeight) {
				position();
				return;
			}
		}
		hide();
	}, { capture: true, passive: true });
	window.addEventListener('resize', hide, { passive: true });

	return {
		refresh,
		attach(button: HTMLButtonElement) {
			setDescription(button, false);
			button.addEventListener('pointerenter', (event) => {
				if (event.pointerType !== 'touch') show(button, 500);
			});
			button.addEventListener('pointerleave', () => {
				if (button === owner) scheduleHide();
			});
			button.addEventListener('focus', () => {
				if (button.matches(':focus-visible')) show(button, 0);
			});
			button.addEventListener('blur', () => {
				if (button === owner) scheduleHide();
			});
		},
	};
};
