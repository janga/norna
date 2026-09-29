import { getSiteSourcePaths } from './site-conventions.mjs';
import path from 'node:path';
import { isInside } from './editor-site-links.mjs';

export const editorFileRemovalPolicy = ({ siteRoot, sourcePath, filePath }) => {
	const directory = path.dirname(sourcePath);
	if (filePath === path.join(directory, 'theme.yaml')) return {
		kind: 'theme',
		effect: directory === getSiteSourcePaths(siteRoot).root
			? 'This homepage will use site-config/site-theme.yaml again. Other pages are unchanged.'
			: 'This branch will use its inherited appearance again. This affects the page or category and its descendants; their own overrides remain.',
	};
	if (directory === getSiteSourcePaths(siteRoot).root && filePath === path.join(siteRoot, 'site-config/shared-content.yaml')) return {
		kind: 'shared-content', effect: 'Shared notices, authored footer content and logo display settings in this file will be removed from the whole site.',
	};
	if (directory === getSiteSourcePaths(siteRoot).root && isInside(path.join(siteRoot, 'public'), filePath)) return {
		kind: 'public', effect: 'This file will no longer be published. Links to it may break; an icon or logo may disappear. References outside page content are not checked.',
	};
	return null;
};
