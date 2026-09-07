const assertHttpUrl = (value, label) => {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${label} must be a non-empty absolute URL.`);
	}

	let url;
	try {
		url = new URL(value.trim());
	} catch {
		throw new Error(`${label} must be an absolute URL such as "https://github.com/owner/repository/edit/main/".`);
	}

	if (!['http:', 'https:'].includes(url.protocol)) {
		throw new Error(`${label} must use http or https.`);
	}
	if (url.username || url.password) {
		throw new Error(`${label} must not contain credentials.`);
	}
	if (url.search || url.hash) {
		throw new Error(`${label} must not contain a query string or fragment.`);
	}

	return url;
};

export const normalizeEditLinkBaseUrl = (value, label = 'editLink.baseUrl') => {
	const url = assertHttpUrl(value, label);
	if (!url.pathname.endsWith('/')) url.pathname = `${url.pathname}/`;
	return url.href;
};

export const getEditSourceUrl = ({ baseUrl, sourcePath }) => {
	const normalizedBaseUrl = normalizeEditLinkBaseUrl(baseUrl);
	if (typeof sourcePath !== 'string' || sourcePath.trim() === '') {
		throw new Error('Edit-source path must be a non-empty project-relative path.');
	}

	const normalizedSourcePath = sourcePath.trim().replaceAll('\\', '/');
	const segments = normalizedSourcePath.split('/');
	if (
		normalizedSourcePath.startsWith('/')
		|| segments.some((segment) => segment === '' || segment === '.' || segment === '..')
	) {
		throw new Error(`Edit-source path "${sourcePath}" must be a project-relative path without traversal segments.`);
	}

	const encodedPath = segments.map((segment) => encodeURIComponent(segment)).join('/');
	return new URL(encodedPath, normalizedBaseUrl).href;
};
