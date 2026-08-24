const fs = require('node:fs');
const path = require('node:path');

const supportedSchemaVersion = 1;
const supportedEditorApiVersion = 1;
const pageDirectoryPattern = /^(?!000)(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const rootFiles = new Map([
	['config.yaml', { documentKind: 'yaml', schemaKind: 'config' }],
	['theme.yaml', { documentKind: 'yaml', schemaKind: 'theme' }],
	['sitewide-content.yaml', { documentKind: 'yaml', schemaKind: 'sitewideContent' }],
	['content.md', { documentKind: 'content', schemaKind: 'contentFrontmatter' }],
]);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const isFile = (filePath) => fs.existsSync(filePath) && fs.statSync(filePath).isFile();
const toPosixPath = (filePath) => filePath.split(path.sep).join('/');

const hasSiteMarkers = (directory) => (
	isFile(path.join(directory, 'config.yaml'))
	&& isFile(path.join(directory, 'content.md'))
);

const isRootFileBeingCreated = (documentPath, directory) => {
	if (path.dirname(documentPath) !== directory || !rootFiles.has(path.basename(documentPath))) return false;
	if (path.basename(documentPath) === 'content.md') return isFile(path.join(directory, 'config.yaml'));
	if (path.basename(documentPath) === 'config.yaml') return isFile(path.join(directory, 'content.md'));
	return false;
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
	if (rootFile) return { ...rootFile, relativePath, pageDirectory: null };

	const pageMatch = relativePath.match(/^pages\/([^/]+)\/(content\.md|theme\.yaml)$/);
	if (!pageMatch || !pageDirectoryPattern.test(pageMatch[1])) return null;
	return {
		documentKind: pageMatch[2] === 'content.md' ? 'content' : 'yaml',
		relativePath,
		pageDirectory: pageMatch[1],
		schemaKind: pageMatch[2] === 'content.md' ? 'contentFrontmatter' : 'theme',
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
