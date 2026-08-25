export const pageDirectoryPattern = /^(?!000)(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

const pageEntryPathSeparator = '--';

export const parsePageDirectory = (pageDirectory, label = 'page directory') => {
	const match = pageDirectory.match(pageDirectoryPattern);

	if (!match) {
		throw new Error(
			`Invalid ${label} "${pageDirectory}". Page directories must use the form NNN-page-id, for example 010-getting-started. The prefix must be 001-999 and page-id may contain only lowercase letters, numbers, and single hyphens.`,
		);
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

	return {
		pageDirectory: normalizedPath,
		pageDirectories: pageDirectories.map(({ pageDirectory }) => pageDirectory),
		pageId: currentPage.pageId,
		pageIds,
		pageOrder: currentPage.pageOrder,
		pageOrders,
		pagePath: pageIds.join('/'),
		parentPagePath: pageIds.length > 1 ? pageIds.slice(0, -1).join('/') : null,
		depth: pageIds.length,
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
