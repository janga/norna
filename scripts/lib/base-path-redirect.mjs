export const getBasePathRedirectLocation = (basePath, requestUrl) => {
	if (basePath === '/') return undefined;

	const basePathWithoutTrailingSlash = basePath.replace(/\/$/, '');
	const parsedRequestUrl = new URL(requestUrl, 'http://localhost');
	if (parsedRequestUrl.pathname !== basePathWithoutTrailingSlash) return undefined;

	return `${basePathWithoutTrailingSlash}/${parsedRequestUrl.search}`;
};
