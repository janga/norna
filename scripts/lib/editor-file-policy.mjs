import { getSiteSourcePaths } from './site-conventions.mjs';
import path from 'node:path';
import { getSourceFileDefinition } from './source-files.mjs';
import { isInside } from './editor-site-links.mjs';

export const editorFileRemovalPolicy = ({ siteRoot, sourcePath, filePath }) => {
	const directory = path.dirname(sourcePath);
	const siteOwner = sourcePath === siteRoot || directory === getSiteSourcePaths(siteRoot).root;
	const definition = getSourceFileDefinition(siteRoot, filePath);
	if (definition && !definition.required && definition.removalEffect
		&& (path.dirname(filePath) === directory || definition.location === 'site-config' && siteOwner)) {
		return { kind: definition.schemaKind === 'sitewideContent' ? 'shared-content' : 'theme', effect: definition.removalEffect };
	}
	if (siteOwner && isInside(path.join(siteRoot, 'public'), filePath)) return {
		kind: 'public', effect: 'This file will no longer be published. Links to it may break; an icon or logo may disappear. References outside page content are not checked.',
	};
	return null;
};
