import { readFile, stat } from 'node:fs/promises';
import { splitSiteFile } from './site-content.mjs';
import { changeYamlField } from './yaml-source-edit.mjs';
import { parsePageOrder } from './page-order.mjs';

export const setPageOrder = (source, order, label) => {
	parsePageOrder(order);
	const eol = source.includes('\r\n') ? '\r\n' : '\n';
	const { frontmatter, frontmatterBody, body } = splitSiteFile(source, label);
	try {
		const yaml = changeYamlField(frontmatterBody, ['navigation', 'order'], order ?? undefined, eol);
		return frontmatter ? `---${eol}${yaml.replace(/\r?\n$/, '')}${eol}---${eol}${body}`
			: `---${eol}${yaml}---${eol}${eol}${source}`;
	} catch (error) { throw Object.assign(new Error(`Cannot set page order in ${label}. ${error.message}`), { sourcePath: label }); }
};

export const pageOrderFileChanges = async changes => Promise.all(changes.map(async ({ node, oldOrder, newOrder }) => {
	const originalSource = await readFile(node.contentPath, 'utf8');
	return { contentPath: node.contentPath, contentLabel: node.contentLabel, oldOrder, newOrder,
		originalPath: node.contentPath, finalPath: node.contentPath, originalSource,
		updatedSource: setPageOrder(originalSource, newOrder, node.contentPath), mode: (await stat(node.contentPath)).mode };
}));
