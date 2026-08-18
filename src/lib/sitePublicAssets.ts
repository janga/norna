import { existsSync } from 'node:fs';
import path from 'node:path';
import { sitePublicDir } from '../../scripts/lib/site-paths.mjs';
import projectConfig from '../../scripts/lib/project-config.mjs';
export { getLogoAsset } from '../../scripts/lib/logo-assets.mjs';
import { withBasePath } from './basePath';

type IconLink = {
	rel: 'icon' | 'apple-touch-icon';
	href: string;
	type?: string;
	sizes?: string;
};

const faviconCandidates: IconLink[] = [
	{
		rel: 'icon',
		href: '/favicon.svg',
		type: 'image/svg+xml',
	},
	{
		rel: 'icon',
		href: '/favicon.ico',
		sizes: 'any',
	},
	{
		rel: 'icon',
		href: '/favicon.png',
		type: 'image/png',
	},
	{
		rel: 'apple-touch-icon',
		href: '/apple-touch-icon.png',
	},
];

const publicAssetExists = (href: string) => {
	const relativePath = href.replace(/^\//, '');
	return existsSync(path.join(sitePublicDir, relativePath));
};

export const getIconLinks = () => faviconCandidates
	.filter((candidate) => publicAssetExists(candidate.href))
	.map((candidate) => ({
		...candidate,
		href: withBasePath(projectConfig.site.basePath, candidate.href),
	}));
