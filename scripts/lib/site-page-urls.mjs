export const getSiteNodePathname = (node) => node.isHome || !node.pagePath
	? '/'
	: `/${node.pagePath}/`;

export const getAbsolutePageUrl = (siteUrl, pathname) => {
	const baseUrl = new URL(siteUrl);
	if (!baseUrl.pathname.endsWith('/')) baseUrl.pathname = `${baseUrl.pathname}/`;

	return new URL(pathname === '/' ? '' : pathname.replace(/^\//, ''), baseUrl).href;
};
