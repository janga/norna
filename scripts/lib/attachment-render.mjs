import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSourcePageLocation } from './source-files.mjs';
import { parsePageMarkdownSource } from './page-markdown.mjs';
import { readPageAttachments, resolveAttachment, attachmentHref } from './page-attachments.mjs';

export const rewriteAttachmentLinks = async (source, fileURL, siteRoot) => {
	if (!fileURL) return source;
	const contentPath = fileURLToPath(fileURL);
	const location = getSourcePageLocation(siteRoot, path.dirname(contentPath));
	if (!location || path.basename(contentPath) !== 'content.md') return source;
	const { files } = await readPageAttachments({ ...location, contentPath });
	if (!files.length) return source;
	const document = await parsePageMarkdownSource(source);
	const edits = new Map();
	for (const link of document.links) {
		const file = resolveAttachment(link.target, location.isHome ? '/' : `/${location.pagePath}/`, files);
		if (!file || !link.targetRange) continue;
		const href = attachmentHref(file, link.target);
		edits.set(link.targetRange.start, { ...link.targetRange, text: link.yamlScalar ? JSON.stringify(href) : href });
	}
	return [...edits.values()].sort((a,b) => b.start-a.start).reduce((text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end), source);
};
