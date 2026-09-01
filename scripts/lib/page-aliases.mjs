import { getSiteNodePathname } from './site-page-urls.mjs';
import { sitemapFilename } from './sitemap.mjs';

export const generatedSiteRoutes = Object.freeze([
	Object.freeze({
		kind: 'generated-route',
		label: `Norna generated ${sitemapFilename}`,
		pathname: `/${sitemapFilename}`,
	}),
]);

const getPagePathname = (page) => page.pathname ?? getSiteNodePathname(page.contentFile ?? page);
const getPageLabel = (page) => page.contentLabel ?? page.contentFile?.contentLabel ?? page.entry?.id ?? getPagePathname(page);
const getPageAliases = (page) => page.aliases ?? page.data?.page?.aliases ?? [];

const createIdentity = ({ kind, label, pathname, source }) => ({
	kind,
	label,
	pathname,
	source,
});

const getPublicFileIdentities = (file) => {
	const identities = [createIdentity({
		kind: 'public-file',
		label: file.label,
		pathname: file.pathname,
		source: file,
	})];

	if (file.pathname === '/index.html') {
		identities.push(createIdentity({
			kind: 'public-file',
			label: file.label,
			pathname: '/',
			source: file,
		}));
	} else if (file.pathname.endsWith('/index.html')) {
		identities.push(createIdentity({
			kind: 'public-file',
			label: file.label,
			pathname: file.pathname.slice(0, -'index.html'.length),
			source: file,
		}));
	}

	return identities;
};

const describeIdentity = (identity) => {
	if (identity.kind === 'page') return `page URL from ${identity.label}`;
	if (identity.kind === 'category') return `navigation category path from ${identity.label}`;
	if (identity.kind === 'public-file') return `public file ${identity.label}`;
	if (identity.kind === 'generated-route') return `generated route ${identity.label}`;
	if (identity.kind === 'page-alias') return `page alias declared in ${identity.label}`;
	return `${identity.kind} from ${identity.label}`;
};

const compareAliases = (left, right) => (
	left.pathname.localeCompare(right.pathname, 'en')
	|| left.targetPathname.localeCompare(right.targetPathname, 'en')
	|| left.contentLabel.localeCompare(right.contentLabel, 'en')
);

export const createPageAliasModel = ({
	pages,
	categories = [],
	publicFiles = [],
	generatedRoutes = generatedSiteRoutes,
}) => {
	const identitiesByPathname = new Map();
	const aliases = [];
	const aliasesByPathname = new Map();
	const diagnostics = [];

	const addIdentity = (identity) => {
		if (!identitiesByPathname.has(identity.pathname)) {
			identitiesByPathname.set(identity.pathname, identity);
		}
	};

	for (const page of pages) {
		addIdentity(createIdentity({
			kind: 'page',
			label: getPageLabel(page),
			pathname: getPagePathname(page),
			source: page,
		}));
	}
	for (const category of categories) {
		addIdentity(createIdentity({
			kind: 'category',
			label: category.categorySourceLabel ?? category.nodeLabel ?? getSiteNodePathname(category),
			pathname: getSiteNodePathname(category),
			source: category,
		}));
	}
	for (const file of publicFiles) {
		for (const identity of getPublicFileIdentities(file)) addIdentity(identity);
	}
	for (const route of generatedRoutes) {
		addIdentity(createIdentity({ ...route, source: route }));
	}

	for (const page of pages) {
		const contentFile = page.contentFile ?? page;
		const contentLabel = getPageLabel(page);
		const targetPathname = getPagePathname(page);

		for (const pathname of getPageAliases(page)) {
			const alias = {
				contentFile,
				contentLabel,
				page,
				pathname,
				targetPathname,
			};
			const conflict = identitiesByPathname.get(pathname);
			if (conflict) {
				diagnostics.push({
					alias,
					code: 'page-alias-collision',
					contentFile,
					fix: conflict.kind === 'page-alias'
						? 'Keep the old URL on exactly one current page.'
						: 'Remove or change the alias. A public URL can identify only one site resource.',
					message: `Page alias "${pathname}" in ${contentLabel} conflicts with ${describeIdentity(conflict)}.`,
					severity: 'error',
				});
				continue;
			}

			aliases.push(alias);
			aliasesByPathname.set(pathname, alias);
			addIdentity(createIdentity({
				kind: 'page-alias',
				label: contentLabel,
				pathname,
				source: alias,
			}));
		}
	}

	aliases.sort(compareAliases);

	return {
		aliases,
		aliasesByPathname,
		diagnostics,
		identitiesByPathname,
	};
};

export const assertPageAliasModel = (model) => {
	if (model.diagnostics.length === 0) return model;

	throw new Error([
		'Page alias validation failed.',
		...model.diagnostics.flatMap((diagnostic) => [
			`- ${diagnostic.message}`,
			`  Fix: ${diagnostic.fix}`,
		]),
	].join('\n'));
};
