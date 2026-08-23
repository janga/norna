import { existsSync } from 'node:fs';
import path from 'node:path';
import { sitePublicDir } from '../../scripts/lib/site-paths.mjs';
import { browserIconAssetDefinitions } from '../../scripts/lib/public-asset-conventions.mjs';
import projectConfig from '../../scripts/lib/project-config.mjs';
export { getLogoAsset } from '../../scripts/lib/logo-assets.mjs';
import { withBasePath } from './basePath';

type IconLink = {
	rel: 'icon' | 'apple-touch-icon';
	href: string;
	type?: string;
	sizes?: string;
};

const faviconCandidates: IconLink[] = browserIconAssetDefinitions.map(({ filename, ...definition }) => ({
	...definition,
	href: `/${filename}`,
}));

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
