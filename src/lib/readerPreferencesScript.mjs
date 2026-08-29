const preferenceDefinitions = Object.freeze({
	appearance: Object.freeze({
		allowed: Object.freeze(['system', 'light', 'dark']),
		cookieName: 'norna-color-mode',
	}),
	readingWidth: Object.freeze({
		allowed: Object.freeze(['narrow', 'standard', 'wide']),
		cookieName: 'norna-reading-width',
	}),
	focusReading: Object.freeze({
		allowed: Object.freeze(['off', 'on']),
		cookieName: 'norna-focus-reading',
	}),
});

export const getReaderPreferencesScript = ({ controls, defaults, cookiePath }) => `(() => {
	const root = document.documentElement;
	const controls = ${JSON.stringify(controls)};
	const defaults = ${JSON.stringify(defaults)};
	const cookiePath = ${JSON.stringify(cookiePath)};
	const definitions = ${JSON.stringify(preferenceDefinitions)};
	const values = { ...defaults };
	const readCookie = (name) => {
		const prefix = encodeURIComponent(name) + '=';
		const cookie = document.cookie.split('; ').find((part) => part.startsWith(prefix));
		return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
	};
	const writeCookie = (name, value, maxAge = 31536000) => {
		try {
			const secure = location.protocol === 'https:' ? '; Secure' : '';
			document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value)
				+ '; Path=' + cookiePath + '; Max-Age=' + maxAge + '; SameSite=Lax' + secure;
		} catch {}
	};
	const isAllowed = (name, value) => definitions[name].allowed.includes(value);
	const updateThemeColor = () => requestAnimationFrame(() => {
		const themeColor = getComputedStyle(root).getPropertyValue('--color-page').trim();
		if (themeColor) document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.content = themeColor);
	});
	const apply = (name, value, persist = false) => {
		const nextValue = isAllowed(name, value) ? value : defaults[name];
		values[name] = nextValue;
		if (name === 'appearance') root.dataset.colorMode = nextValue;
		if (name === 'readingWidth') root.dataset.readingWidth = nextValue;
		if (name === 'focusReading') root.dataset.focusReading = nextValue;
		if (persist) writeCookie(definitions[name].cookieName, nextValue);
		if (name === 'appearance') updateThemeColor();
	};
	for (const name of Object.keys(definitions)) {
		const saved = controls[name] ? readCookie(definitions[name].cookieName) : null;
		apply(name, saved && isAllowed(name, saved) ? saved : defaults[name]);
	}
	root.dataset.readerPreferencesReady = 'true';
	const syncControls = () => {
		document.querySelectorAll('[data-reader-appearance]').forEach((input) => {
			input.checked = input.value === values.appearance;
		});
		document.querySelectorAll('[data-reader-width]').forEach((input) => {
			input.checked = input.value === values.readingWidth;
		});
		document.querySelectorAll('[data-reader-focus]').forEach((input) => {
			input.checked = values.focusReading === 'on';
		});
	};
	document.addEventListener('DOMContentLoaded', () => {
		syncControls();
		document.querySelectorAll('[data-reader-appearance]').forEach((input) => {
			input.addEventListener('change', () => {
				if (input.checked) apply('appearance', input.value, true);
			});
		});
		document.querySelectorAll('[data-reader-width]').forEach((input) => {
			input.addEventListener('change', () => {
				if (input.checked) apply('readingWidth', input.value, true);
			});
		});
		document.querySelectorAll('[data-reader-focus]').forEach((input) => {
			input.addEventListener('change', () => apply('focusReading', input.checked ? 'on' : 'off', true));
		});
		document.querySelectorAll('[data-reader-reset]').forEach((button) => {
			button.addEventListener('click', () => {
				for (const name of Object.keys(definitions)) {
					writeCookie(definitions[name].cookieName, '', 0);
					apply(name, defaults[name]);
				}
				syncControls();
			});
		});
		document.querySelectorAll('[data-display-settings]').forEach((settings) => {
			settings.addEventListener('keydown', (event) => {
				if (event.key !== 'Escape') return;
				settings.removeAttribute('open');
				settings.querySelector('summary')?.focus();
			});
		});
	});
	document.addEventListener('click', (event) => {
		document.querySelectorAll('[data-display-settings][open]').forEach((settings) => {
			if (!settings.contains(event.target)) settings.removeAttribute('open');
		});
	});
	matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if (values.appearance === 'system') updateThemeColor();
	});
})();`;
