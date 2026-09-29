import path from 'node:path';

// Logical identities stay independent of the physical root/ directory.
export const homePageDirectory = '.';
export const legacyHomePageDirectory = '000-home';

export const getSiteSourcePaths = (siteRoot) => {
	const root = path.join(siteRoot, 'root');
	return { root, pages: path.join(root, 'pages'), content: path.join(root, 'content.md'),
		images: path.join(root, 'images'), theme: path.join(root, 'theme.yaml') };
};

export const getPageSourceDirectory = (pageDirectory) => (
	pageDirectory === homePageDirectory ? 'root' : `root/pages/${pageDirectory}`
);

export const getPageImageSourceKey = (pageDirectory, image) => (
	[getPageSourceDirectory(pageDirectory), 'images', image].filter(Boolean).join('/')
);
