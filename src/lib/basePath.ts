export const withBasePath = (basePath: string, value: string) => {
	if (
		basePath === '/'
		|| value.startsWith('#')
		|| value.startsWith('//')
		|| /^[a-z][a-z0-9+.-]*:/i.test(value)
	) {
		return value;
	}

	if (!value.startsWith('/')) {
		return value;
	}

	return `${basePath.replace(/\/$/, '')}${value}`;
};

export const applyBasePathToHtml = (basePath: string, html: string) =>
	html.replace(/\b(href|src)=(["'])\/(?!\/)([^"']*)\2/g, (_match, attribute: string, quote: string, path: string) => (
		`${attribute}=${quote}${withBasePath(basePath, `/${path}`)}${quote}`
	));
