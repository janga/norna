import packageJson from '../../package.json' with { type: 'json' };
import routes from './documentation-routes.json' with { type: 'json' };

const websiteRoot = 'https://janga.github.io/norna/reference/';
const repositoryRoot = 'https://github.com/janga/norna/blob/';

// Release tags through 0.7.26 contain the reference under docs/. Newer tags
// contain its single authored source in the documentation site's page tree.
export const usesLegacyReference = (version) => {
	const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version ?? '');
	if (!match) return false;
	const [major, minor, patch] = match.slice(1).map(Number);
	return major === 0 && (minor < 7 || (minor === 7 && patch <= 26));
};

const referenceDestination = (file, anchor) => {
	const target = routes.legacy[`${file}#${anchor}`] ?? routes.legacy[file];
	if (!target) throw new Error(`Unknown documentation destination: ${file}${anchor ? `#${anchor}` : ''}`);
	const [route, targetAnchor] = target.split('#');
	const source = routes.sources[route];
	if (!source) throw new Error(`Missing documentation source for ${route}`);
	return { route, source, anchor: targetAnchor, url: websiteRoot + target };
};

export const documentationLinkForVersion = (version, label, file, anchor) => {
	const destination = referenceDestination(file, anchor);
	const reference = version ? `v${version}` : 'main';
	const source = usesLegacyReference(version)
		? `docs/${file}${anchor ? `#${anchor}` : ''}`
		: `${destination.source}${destination.anchor ? `#${destination.anchor}` : ''}`;
	const sourceLabel = version ? `Norna ${version} source reference` : 'Reference source';
	return `[${label} (current)](${destination.url})\n\n[${sourceLabel}](${repositoryRoot}${reference}/${source})`;
};

export const documentationRef = `v${packageJson.version}`;

export const documentationLink = (label, file, anchor) => (
	documentationLinkForVersion(packageJson.version, label, file, anchor)
);
