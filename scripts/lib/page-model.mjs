import { homePageDirectory } from './site-conventions.mjs';

export const pageDirectoryPattern = /^(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

const pageEntryPathSeparator = '--';

export const parsePageDirectory = (pageDirectory, label = 'page directory') => {
	const match = pageDirectory.match(pageDirectoryPattern);

	if (!match) {
		throw new Error(
			`Invalid ${label} "${pageDirectory}". Page directories must use the form NNN-page-id, for example 010-getting-started. Page ids may contain only lowercase letters, numbers, and single hyphens.`,
		);
	}
	if (match[1] === '000' && pageDirectory !== homePageDirectory) {
		throw new Error(`Invalid ${label} "${pageDirectory}". The 000 prefix is reserved for ${homePageDirectory}.`);
	}

	return {
		pageDirectory,
		pageOrder: Number.parseInt(match[1], 10),
		pageId: match[2],
	};
};

const normalizePageDirectoryPath = (pageDirectoryPath) => pageDirectoryPath.replaceAll('\\', '/');

export const parsePageDirectoryPath = (pageDirectoryPath, label = 'page directory path') => {
	const normalizedPath = normalizePageDirectoryPath(pageDirectoryPath);
	const segments = normalizedPath.split('/').filter(Boolean);

	if (!normalizedPath || normalizedPath.startsWith('/') || normalizedPath.endsWith('/') || segments.length % 2 === 0) {
		throw new Error(
			`Invalid ${label} "${pageDirectoryPath}". Nested pages must use the form NNN-page-id/pages/NNN-child-id.`,
		);
	}

	const pageDirectories = [];
	for (const [index, segment] of segments.entries()) {
		if (index % 2 === 1) {
			if (segment !== 'pages') {
				throw new Error(
					`Invalid ${label} "${pageDirectoryPath}". Use a pages directory between nested page directories.`,
				);
			}
			continue;
		}

		pageDirectories.push(parsePageDirectory(segment, `${label} segment ${segment}`));
	}

	const pageIds = pageDirectories.map(({ pageId }) => pageId);
	const pageOrders = pageDirectories.map(({ pageOrder }) => pageOrder);
	const currentPage = pageDirectories.at(-1);
	const homeIndex = pageDirectories.findIndex(({ pageDirectory }) => pageDirectory === homePageDirectory);
	if (homeIndex > 0) {
		throw new Error(`Invalid ${label} "${pageDirectoryPath}". ${homePageDirectory} is allowed only as a top-level page.`);
	}
	if (homeIndex === 0 && pageDirectories.length > 1) {
		throw new Error(
			`Invalid ${label} "${pageDirectoryPath}". ${homePageDirectory} is the homepage and cannot contain child pages. Place the page beside it under site/pages/, or below another non-home page.`,
		);
	}
	const isHome = homeIndex === 0;
	const logicalPageIds = isHome ? [] : pageIds;
	const logicalPageOrders = isHome ? [] : pageOrders;

	return {
		pageDirectory: normalizedPath,
		pageDirectories: pageDirectories.map(({ pageDirectory }) => pageDirectory),
		pageId: currentPage.pageId,
		pageIds: logicalPageIds,
		pageOrder: currentPage.pageOrder,
		pageOrders: logicalPageOrders,
		pagePath: logicalPageIds.join('/'),
		parentPagePath: logicalPageIds.length > 1
			? logicalPageIds.slice(0, -1).join('/')
			: null,
		depth: pageDirectories.length,
	};
};

export const encodePageDirectoryPath = (pageDirectoryPath) => {
	const { pageDirectories } = parsePageDirectoryPath(pageDirectoryPath);
	return pageDirectories.join(pageEntryPathSeparator);
};

export const decodePageDirectoryPath = (pageEntryPath, label = 'page entry path') => {
	const pageDirectories = pageEntryPath.split(pageEntryPathSeparator);
	if (pageDirectories.some((pageDirectory) => !pageDirectory)) {
		throw new Error(`Invalid ${label} "${pageEntryPath}".`);
	}

	return pageDirectories.join('/pages/');
};

export const getPageDirectoryAncestors = (pageDirectoryPath) => {
	const { pageDirectories } = parsePageDirectoryPath(pageDirectoryPath);
	return pageDirectories.map((_, index) => (
		pageDirectories.slice(0, index + 1).join('/pages/')
	));
};
