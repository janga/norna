const fs = require('node:fs');
const path = require('node:path');

const supportedSchemaVersion = 6;
const supportedEditorApiVersion = 3;
// Only the two discovery markers are known before the selected engine is found.
const bootstrapFiles = [
	{ name: 'content.md', location: 'page', schemaKind: 'contentFrontmatter' },
	{ name: 'settings.yaml', location: 'site-config', schemaKind: 'config' },
];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const isFile = (filePath) => fs.existsSync(filePath) && fs.statSync(filePath).isFile();
const toPosixPath = (filePath) => filePath.split(path.sep).join('/');
const isPageDirectoryPath = (pageDirectory, pattern) => {
	if (!pattern) return false;
	const segments = pageDirectory.split('/');
	return segments.length % 2 === 1 && segments.every((segment, index) => index % 2 === 1 ? segment === 'pages' : new RegExp(pattern).test(segment));
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

const classifyDocument = (siteRoot, documentPath, manifest = findNornaPackage(siteRoot)?.manifest) => {
	const relativePath = toPosixPath(path.relative(siteRoot, path.resolve(documentPath)));
	if (!relativePath || relativePath.startsWith('../') || path.isAbsolute(relativePath)) return null;
	const parts = relativePath.split('/');
	const name = parts.at(-1);
	let pageDirectory = null;
	if (parts[0] === 'root' && parts.length === 2) pageDirectory = '.';
	else if (relativePath.startsWith('root/pages/')) {
		const value = parts.slice(2, -1).join('/');
		if (isPageDirectoryPath(value, manifest?.pageDirectoryPattern)) pageDirectory = value;
	}
	const definition = (manifest?.sourceFiles ?? bootstrapFiles).find((entry) => entry.name === name && (
		entry.location === 'page' ? pageDirectory !== null : relativePath === `${entry.location}/${entry.name}`
	));
	if (!definition) return null;
	return { documentKind: definition.schemaKind === 'contentFrontmatter' ? 'content' : 'yaml', relativePath, pageDirectory,
		schemaKind: pageDirectory === '.' && definition.rootSchemaKind ? definition.rootSchemaKind : definition.schemaKind };
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
	const file = classifyDocument(project.siteRoot, documentPath, project.nornaPackage?.manifest);
	return file ? { ...project, ...file } : null;
};

module.exports = {
	classifyDocument,
	findNornaPackage,
	findNornaSiteRoot,
	getNornaDocumentContext,
	getNornaProjectContext,
	supportedEditorApiVersion,
	supportedSchemaVersion,
};
