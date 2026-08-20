import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDirectoryEnvName = 'NORNA_SITE_DIR';
const invocationRootEnvName = 'NORNA_INVOCATION_ROOT';
const defaultSiteDirectory = 'site';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

export const engineRoot = path.resolve(currentDirectory, '..', '..');
export const siteDirectoryEnv = siteDirectoryEnvName;

const normalizeSiteDirectory = (value) => String(value ?? '').trim();
const normalizeInvocationRoot = (value) => String(value ?? '').trim();

const configuredInvocationRoot = normalizeInvocationRoot(process.env[invocationRootEnvName]);
export const invocationRoot = configuredInvocationRoot
	? path.resolve(configuredInvocationRoot)
	: process.cwd();

const hasSiteFilesInDirectory = (siteDir) => {
	return (
		existsSync(path.join(siteDir, 'config.mjs'))
		&& existsSync(path.join(siteDir, 'content.md'))
	);
};

const hasSiteFiles = (projectRoot, siteDirectory) => {
	const siteDir = path.resolve(projectRoot, siteDirectory);

	return hasSiteFilesInDirectory(siteDir);
};

const findSiteProjectRoot = (startDirectory, siteDirectory) => {
	let current = path.resolve(startDirectory);

	while (true) {
		if (hasSiteFiles(current, siteDirectory)) {
			return current;
		}

		const parent = path.dirname(current);
		if (parent === current) {
			return null;
		}

		current = parent;
	}
};

const hasSiteDirectoryEnv = Object.hasOwn(process.env, siteDirectoryEnvName);
const configuredSiteDirectory = normalizeSiteDirectory(process.env[siteDirectoryEnvName]);
const hasConfiguredSiteDirectory = hasSiteDirectoryEnv && configuredSiteDirectory !== '';
const fallbackSiteDirectory = hasConfiguredSiteDirectory ? configuredSiteDirectory : defaultSiteDirectory;

if (hasSiteDirectoryEnv && !configuredSiteDirectory) {
	throw new Error(`${siteDirectoryEnvName} must not be empty.`);
}

const resolveSitePaths = () => {
	if (path.isAbsolute(fallbackSiteDirectory)) {
		const siteDir = path.resolve(fallbackSiteDirectory);
		const siteProjectRoot = path.dirname(siteDir);

		return {
			siteDirectory: path.relative(siteProjectRoot, siteDir) || path.basename(siteDir),
			siteDir,
			siteProjectRoot,
		};
	}

	if (!hasConfiguredSiteDirectory && hasSiteFilesInDirectory(invocationRoot)) {
		const siteDir = invocationRoot;
		const siteProjectRoot = path.dirname(siteDir);

		return {
			siteDirectory: path.relative(siteProjectRoot, siteDir) || path.basename(siteDir),
			siteDir,
			siteProjectRoot,
		};
	}

	const discoveredRoot = findSiteProjectRoot(invocationRoot, fallbackSiteDirectory);
	const siteProjectRoot = discoveredRoot ?? invocationRoot;

	return {
		siteDirectory: fallbackSiteDirectory,
		siteDir: path.resolve(siteProjectRoot, fallbackSiteDirectory),
		siteProjectRoot,
	};
};

const resolvedSitePaths = resolveSitePaths();

export const siteProjectRoot = resolvedSitePaths.siteProjectRoot;
export const root = siteProjectRoot;
export const siteDirectory = resolvedSitePaths.siteDirectory;

if (!siteDirectory) {
	throw new Error(`${siteDirectoryEnvName} must not be empty.`);
}

const toPosixPath = (filePath) => filePath.split(path.sep).join('/');
const getPathLabel = (filePath) => {
	const relativePath = path.relative(siteProjectRoot, filePath);

	if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
		return toPosixPath(relativePath);
	}

	return toPosixPath(filePath);
};

export const siteDir = resolvedSitePaths.siteDir;
export const siteConfigPath = path.join(siteDir, 'config.mjs');
export const siteThemePath = path.join(siteDir, 'theme.md');
export const siteContentPath = path.join(siteDir, 'content.md');
export const sitewideContentPath = path.join(siteDir, 'sitewide-content.md');
export const siteImagesDir = path.join(siteDir, 'images');
export const siteRoutesDir = path.join(siteDir, 'routes');
export const sitePublicDir = path.join(siteDir, 'public');
export const siteStateDir = path.join(siteDir, '.norna');
export const astroPublicDir = path.join(siteStateDir, 'public');
export const astroDistDir = path.join(siteProjectRoot, 'dist');
export const astroCacheDir = path.join(siteProjectRoot, '.astro');
export const generatedImagesDir = path.join(astroPublicDir, 'images', 'generated');
export const originalImagesDir = path.join(astroPublicDir, 'images', 'original');
export const generatedImagesManifestPath = path.join(siteStateDir, 'generated-images.json');

export const engineRootLabel = getPathLabel(engineRoot);
export const invocationRootLabel = getPathLabel(invocationRoot);
export const siteProjectRootLabel = getPathLabel(siteProjectRoot);
export const siteDirLabel = getPathLabel(siteDir);
export const siteConfigLabel = getPathLabel(siteConfigPath);
export const siteThemeLabel = getPathLabel(siteThemePath);
export const siteContentLabel = getPathLabel(siteContentPath);
export const sitewideContentLabel = getPathLabel(sitewideContentPath);
export const siteImagesLabel = getPathLabel(siteImagesDir);
export const siteRoutesLabel = getPathLabel(siteRoutesDir);
export const sitePublicLabel = getPathLabel(sitePublicDir);
export const astroPublicLabel = getPathLabel(astroPublicDir);
export const generatedImagesManifestLabel = getPathLabel(generatedImagesManifestPath);
