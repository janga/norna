// Page-directory identity for the site root; child identities are relative to pages/.
export const homePageDirectory = '.';
export const legacyHomePageDirectory = '000-home';

export const getPageSourceDirectory = (pageDirectory) => (
	pageDirectory === homePageDirectory ? '' : `pages/${pageDirectory}`
);

export const getPageImageSourceKey = (pageDirectory, image) => (
	[getPageSourceDirectory(pageDirectory), 'images', image].filter(Boolean).join('/')
);
