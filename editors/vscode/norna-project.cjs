const fs = require('node:fs');
const path = require('node:path');

const supportedSchemaVersion = 5;
const supportedEditorApiVersion = 3;
const pageDirectoryPattern = /^(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const rootFiles = new Map([
	['root/content.md', { documentKind: 'content', schemaKind: 'contentFrontmatter', pageDirectory: '.' }],
	['root/theme.yaml', { documentKind: 'yaml', schemaKind: 'pageTheme', pageDirectory: '.' }],
	['site-config/settings.yaml', { documentKind: 'yaml', schemaKind: 'config' }],
	['site-config/site-theme.yaml', { documentKind: 'yaml', schemaKind: 'theme' }],
	['site-config/shared-content.yaml', { documentKind: 'yaml', schemaKind: 'sitewideContent' }],
]);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const isFile = (filePath) => fs.existsSync(filePath) && fs.statSync(filePath).isFile();
const toPosixPath = (filePath) => filePath.split(path.sep).join('/');
const isPageDirectoryPath = (pageDirectory) => {
	const segments = pageDirectory.split('/');
	if (segments.length % 2 === 0) return false;

	return segments.every((segment, index) => {
		if (index % 2 === 1) return segment === 'pages';
		const match = segment.match(pageDirectoryPattern);
		return Boolean(match && match[1] !== '000');
	});
};

const hasSiteMarkers = (directory) => (
	isFile(path.join(directory, 'site-config', 'settings.yaml'))
	&& (isFile(path.join(directory, 'root', 'content.md')))
);

const isRootFileBeingCreated = (documentPath, directory) => {
	const relative = toPosixPath(path.relative(directory, documentPath));
	if (relative === 'site-config/settings.yaml') {
		return isFile(path.join(directory, 'root', 'content.md'));
	}
	return relative === 'root/content.md' && isFile(path.join(directory, 'site-config', 'settings.yaml'));
};

const findNornaSiteRoot = (documentPath) => {
	const absolutePath = path.resolve(documentPath);
	let directory = path.dirname(absolutePath);

	while (true) {
		if (hasSiteMarkers(directory) || isRootFileBeingCreated(absolutePath, directory)) return directory;
		const parent = path.dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
};

const readNornaPackageAt = (root) => {
	const packagePath = path.join(root, 'package.json');
	const manifestPath = path.join(root, 'schemas', 'manifest.json');
	if (!isFile(packagePath) || !isFile(manifestPath)) return null;

	try {
		const packageJson = readJson(packagePath);
		if (packageJson.name !== '@janga/norna') return null;
		return { manifest: readJson(manifestPath), manifestPath, packageJson, root };
	} catch {
		return null;
	}
};

const findNornaPackage = (siteRoot) => {
	let directory = path.resolve(siteRoot);

	while (true) {
		const ownPackage = readNornaPackageAt(directory);
		if (ownPackage) return ownPackage;

		const installedPackage = readNornaPackageAt(path.join(directory, 'node_modules', '@janga', 'norna'));
		if (installedPackage) return installedPackage;

		const parent = path.dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
};

const classifyDocument = (siteRoot, documentPath) => {
	const relativePath = toPosixPath(path.relative(siteRoot, path.resolve(documentPath)));
	if (!relativePath || relativePath.startsWith('../') || path.isAbsolute(relativePath)) return null;

	const rootFile = rootFiles.get(relativePath);
	if (rootFile) return { pageDirectory: null, ...rootFile, relativePath };

	const pageMatch = relativePath.match(/^root\/pages\/(.+)\/(content\.md|theme\.yaml)$/);
	if (!pageMatch || !isPageDirectoryPath(pageMatch[1])) return null;
	const schemaKind = pageMatch[2] === 'content.md'
			? 'contentFrontmatter'
			: 'pageTheme';
	return {
		documentKind: pageMatch[2] === 'content.md' ? 'content' : 'yaml',
		relativePath,
		pageDirectory: pageMatch[1],
		schemaKind,
	};
};

const getNornaProjectContext = (documentPath) => {
	const siteRoot = findNornaSiteRoot(documentPath);
	if (!siteRoot) return null;
	const nornaPackage = findNornaPackage(siteRoot);
	if (!nornaPackage) return { editorCompatible: false, nornaPackage: null, schemaCompatible: false, siteRoot };

	return {
		editorCompatible: nornaPackage.manifest.editorApiVersion === supportedEditorApiVersion,
		nornaPackage,
		schemaCompatible: nornaPackage.manifest.schemaVersion === supportedSchemaVersion,
		siteRoot,
	};
};

const getNornaDocumentContext = (documentPath) => {
	const project = getNornaProjectContext(documentPath);
	if (!project) return null;
	const file = classifyDocument(project.siteRoot, documentPath);
	return file ? { ...project, ...file } : null;
};

module.exports = {
	classifyDocument,
	findNornaPackage,
	findNornaSiteRoot,
	getNornaDocumentContext,
	getNornaProjectContext,
	pageDirectoryPattern,
	supportedEditorApiVersion,
	supportedSchemaVersion,
};
