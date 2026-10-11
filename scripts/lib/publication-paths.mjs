import { logoAssetFilenames, browserIconAssetFilenames, socialImageAssetFilenames } from './public-asset-conventions.mjs';

export const resourcePrefix = '/_norna/';
export const attachmentOutputPrefix = `${resourcePrefix}downloads/`;
export const sharedOutputPrefix = `${resourcePrefix}shared/`;
export const searchOutputDirectory = '_norna/search';
export const compiledOutputDirectory = '_norna/assets';
const technicalFiles = new Set(['robots.txt', 'CNAME', 'llms.txt']);
const siteImages = new Set([...logoAssetFilenames, ...browserIconAssetFilenames, ...socialImageAssetFilenames]);
const key = value => value.normalize('NFC').toLowerCase();
const reservedRoots = new Set(['_norna', '_astro', 'images', 'sitemap.xml', '404.html', '.well-known']);
const safeSegment = value => Boolean(value) && value === value.trim() && !/[\\/\x00-\x1f\x7f<>:"|?*#%]/.test(value) && !/^\.{1,2}$/.test(value) && !/[. ]$/.test(value);

export const isVerificationFilename = value => typeof value === 'string' && safeSegment(value)
	&& !value.startsWith('.') && !reservedRoots.has(key(value))
	&& ![...technicalFiles, ...siteImages].some(name => key(name) === key(value));

export const attachmentPublicationPath = (pagePathname, filename) => {
	// Double hyphens and ~ cannot occur inside a page slug. Keep the complete
	// page identity in one segment so extensionless files cannot shadow children.
	const pageKey = pagePathname === '/' ? '~home' : pagePathname.slice(1, -1).split('/').join('--');
	return `${attachmentOutputPrefix}${pageKey}/${filename}`;
};

export const publicFilePublication = (relativePath, { verificationFiles = [] } = {}, { directory = false } = {}) => {
	const segments = relativePath.split('/');
	if (!segments.every(safeSegment)) throw new Error(`public/${relativePath} has an unsafe path. Use regular names without URL punctuation or parent-directory segments.`);
	if (directory) {
		if (segments[0] === '.well-known') return { pathname: '/' + relativePath, kind: 'public-directory' };
		throw new Error(`public/${relativePath}/ is not a supported public folder. Put content images in the owning page’s images/ beside content.md. Only .well-known/ is supported here, for technical files.`);
	}
	if (technicalFiles.has(relativePath) || segments[0] === '.well-known' && segments.length > 1 || verificationFiles.includes(relativePath) && isVerificationFilename(relativePath)) {
		return { pathname: '/' + relativePath, kind: 'technical-file' };
	}
	if (siteImages.has(relativePath)) {
		return { pathname: sharedOutputPrefix + relativePath, kind: 'shared-image' };
	}
	const generated = ['_norna', '_astro', 'sitemap.xml', '404.html'].includes(key(segments[0]));
	throw new Error(`public/${relativePath} ${generated ? 'conflicts with a generated resource area' : 'is not a supported public file'}. Put content images in the owning page’s images/ beside content.md and documents in its downloads/. Public images must use a recognized logo, favicon, apple-touch-icon or social-image filename. Declare exact root verification filenames in verificationFiles.`);
};

export const publicationIssues = ({ pages = [], publicFiles = [], attachments = [], images = [], generatedRoutes = [] } = {}) => {
	const issues = [];
	const outputs = [];
	const add = (pathname, label, owner) => outputs.push({ pathname, label, owner });
	for (const page of pages) {
		const label = page.contentFile?.contentLabel ?? page.contentLabel ?? page.pathname;
		for (const route of [page.pathname, ...(page.aliases ?? [])]) {
			if (!route) continue;
			if (['/_norna', '/_astro', '/.well-known'].some(prefix => key(route) === prefix || key(route).startsWith(prefix + '/'))) {
				issues.push({ severity: 'error', code: 'reserved-publication-path', message: `${label} claims ${route}, which belongs to Norna or technical public files.`, fix: 'Choose a page or alias outside the reserved area.' });
			}
			add(route + 'index.html', route === page.pathname ? label : `${label} (alias ${route})`, 'page');
		}
	}
	for (const file of publicFiles) add(file.pathname, file.label ?? file.filePath ?? file.pathname, 'public');
	for (const file of attachments) add(file.pathname, file.filePath ?? file.pathname, 'attachment');
	for (const file of images) add(file.pathname, file.label, 'image');
	for (const route of generatedRoutes) add(route.pathname.endsWith('/') ? route.pathname + 'index.html' : route.pathname, route.label ?? route.pathname, 'generated');
	// 404 is always generated, including sites without a search page.
	if (!generatedRoutes.some(route => route.pathname === '/404.html')) add('/404.html', 'Norna generated 404 page', 'generated');
	const seen = [];
	for (const output of outputs) {
		const target = key(output.pathname);
		const conflict = seen.find(candidate => target === candidate.key || target.startsWith(candidate.key + '/') || candidate.key.startsWith(target + '/'));
		if (conflict) issues.push({ severity: 'error', code: output.owner === 'attachment' || conflict.owner === 'attachment' ? 'attachment-output-collision' : 'publication-collision',
			message: `${output.label} publishes ${output.pathname}, which conflicts with ${conflict.label} at ${conflict.pathname}.`,
			fix: 'Rename or relocate the conflicting source. Each published path must have one owner.' });
		seen.push({ ...output, key: target });
	}
	return issues;
};
