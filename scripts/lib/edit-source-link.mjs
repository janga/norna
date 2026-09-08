import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const localEditorNames = Object.freeze(['vscode']);

const assertHttpUrl = (value, label) => {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${label} must be a non-empty absolute URL.`);
	}

	let url;
	try {
		url = new URL(value.trim());
	} catch {
		throw new Error(`${label} must be an absolute URL such as "https://github.com/owner/repository/edit/main/".`);
	}

	if (!['http:', 'https:'].includes(url.protocol)) {
		throw new Error(`${label} must use http or https.`);
	}
	if (url.username || url.password) {
		throw new Error(`${label} must not contain credentials.`);
	}
	if (url.search || url.hash) {
		throw new Error(`${label} must not contain a query string or fragment.`);
	}

	return url;
};

export const normalizeEditLinkBaseUrl = (value, label = 'editLink.baseUrl') => {
	const url = assertHttpUrl(value, label);
	if (!url.pathname.endsWith('/')) url.pathname = `${url.pathname}/`;
	return url.href;
};

export const getEditSourceUrl = ({ baseUrl, sourcePath }) => {
	const normalizedBaseUrl = normalizeEditLinkBaseUrl(baseUrl);
	if (typeof sourcePath !== 'string' || sourcePath.trim() === '') {
		throw new Error('Edit-source path must be a non-empty project-relative path.');
	}

	const normalizedSourcePath = sourcePath.trim().replaceAll('\\', '/');
	const segments = normalizedSourcePath.split('/');
	if (
		normalizedSourcePath.startsWith('/')
		|| segments.some((segment) => segment === '' || segment === '.' || segment === '..')
	) {
		throw new Error(`Edit-source path "${sourcePath}" must be a project-relative path without traversal segments.`);
	}

	const encodedPath = segments.map((segment) => encodeURIComponent(segment)).join('/');
	return new URL(encodedPath, normalizedBaseUrl).href;
};

export const isLoopbackHostname = (hostname) => {
	const normalizedHostname = String(hostname ?? '')
		.trim()
		.toLowerCase()
		.replace(/^\[|\]$/g, '')
		.replace(/\.$/, '');

	return normalizedHostname === 'localhost'
		|| normalizedHostname.endsWith('.localhost')
		|| normalizedHostname === '::1'
		|| normalizedHostname.startsWith('::ffff:127.')
		|| /^127(?:\.\d{1,3}){3}$/.test(normalizedHostname);
};

export const getLocalEditorSourceUrl = ({ editor, sourcePath }) => {
	if (!localEditorNames.includes(editor)) {
		throw new Error(`Unknown local editor "${editor}". Use one of: ${localEditorNames.join(', ')}.`);
	}
	if (typeof sourcePath !== 'string' || !path.isAbsolute(sourcePath)) {
		throw new Error('Local editor source path must be absolute.');
	}

	const fileUrl = pathToFileURL(path.normalize(sourcePath));
	return `vscode://file${fileUrl.pathname}`;
};

export const resolveEditSourceTarget = ({
	baseUrl,
	development = false,
	hostname,
	localEditor,
	sourceLabel,
	sourcePath,
}) => {
	if (development && localEditor && isLoopbackHostname(hostname)) {
		return Object.freeze({
			href: getLocalEditorSourceUrl({ editor: localEditor, sourcePath }),
			kind: 'local',
		});
	}
	if (!baseUrl) return null;

	return Object.freeze({
		href: getEditSourceUrl({ baseUrl, sourcePath: sourceLabel }),
		kind: 'remote',
	});
};
