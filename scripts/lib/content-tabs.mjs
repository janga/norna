import { markdownToMdast } from 'satteri';
import { parseQuotedContentString } from './code-fence-metadata.mjs';

// Only delimiters belong to this scanner. Markdown parsing and source positions
// stay with Satteri, including code examples that happen to contain delimiters.
export const parseContentTabs = (source, { label = 'Markdown', lineOffset = 0 } = {}) => {
	if (!/^\s*(?:(?:>\s*|[-+*]\s+))?:{3,}\s*tabs?\b/m.test(source)) return { groups: [], diagnostics: [], replacements: [], maskedSource: source };
	const tree = markdownToMdast(source, { features: { gfm: true, frontmatter: true } });
	const nodes = [];
	const visit = (node, parent) => {
		nodes.push({ node, parent });
		for (const child of node.children ?? []) visit(child, node);
	};
	visit(tree, null);
	const ignored = nodes.filter(({ node }) => ['code', 'inlineCode', 'html', 'yaml', 'toml'].includes(node.type));
	const groups = [];
	const diagnostics = [];
	const replacements = [];
	let group = null;
	let panel = null;
	const outerContainers = [];
	let offset = 0;
	let section = 'page introduction';
	const error = (message, at = offset) => diagnostics.push({
		code: 'invalid-content-tabs', severity: 'error', offset: at,
		line: lineOffset + source.slice(0, at).split('\n').length,
		message: `${label} line ${lineOffset + source.slice(0, at).split('\n').length}, section "${groups.find((item) => at >= item.start && at < (item.end ?? source.length))?.section ?? section}": ${message}`,
	});
	for (const [index, line] of source.split('\n').entries()) {
		const start = offset;
		offset += line.length + 1;
		const contentStart = start + line.search(/\S|$/);
		if (ignored.some(({ node }) => contentStart >= node.position.start.offset && contentStart < node.position.end.offset)) continue;
		if (!group && /^#{1,3}\s/.test(line)) section = line.replace(/^#+\s*/, '').replace(/\s*\{#.*\}$/, '');
		const match = line.match(/^(\s*)(:{3,})\s*(.*?)\s*$/);
		if (!match) {
			if (group && !panel && line.trim()) error('Put content inside a labelled tab, not directly inside tabs.', start);
			if (/^\s*(?:>\s*|[-+*]\s+)(?::+)\s*tabs?\b/.test(line)) error('Place tabs directly in the section, outside lists and blockquotes.', start);
			continue;
		}
		const [, indent, fence, declaration] = match;
		const name = declaration.split(/\s/)[0];
		if (!group && name !== 'tabs' && name !== 'tab') {
			if (declaration) outerContainers.push(fence.length);
			else if (outerContainers.length) outerContainers.pop();
			else if (groups.length) error('This closing marker has no open tab group.', start);
			continue;
		}
		const replace = (kind, data = {}) => replacements.push({ start, end: start + line.length, kind, ...data });
		if (indent || (!group && nodes.some(({ node, parent }) => node.type === 'paragraph' && parent?.type !== 'root'
			&& start >= node.position.start.offset && start < node.position.end.offset))) {
			error('Place tabs directly in the section, outside other blocks.', start);
		}
		if (name === 'tabs') {
			if (outerContainers.length) error('Place tabs directly in the section, outside other containers.', start);
			if (group) { error('Tab groups cannot be nested.', start); continue; }
			if (fence !== '::::' || declaration !== 'tabs') error('Open a tab group with ":::: tabs" on its own line.', start);
			group = { index: groups.length, start, section, line: lineOffset + index + 1, panels: [] };
			groups.push(group);
			replace('group-start', { index: group.index });
		} else if (name === 'tab') {
			if (!group) { error('A tab must be inside a ":::: tabs" block.', start); continue; }
			if (panel) error('Close the preceding tab with ":::" before starting another tab.', start);
			const decoded = parseQuotedContentString(declaration.slice(3).trim());
			let title = decoded.value ?? '';
			if (fence !== ':::' || decoded.error || decoded.rest || !title.trim()) {
				error(`Write a nonempty quoted label, for example ::: tab "Windows".${decoded.error ? ` ${decoded.error}` : ''}`, start);
				title = '';
			}
			if (group.panels.some((item) => item.label.normalize('NFC') === title.trim().normalize('NFC'))) error(`Duplicate tab label "${title}". Use unique labels within this group.`, start);
			panel = { label: title.trim(), start: offset, declarationStart: start, index: group.panels.length };
			group.panels.push(panel);
			replace('panel-start', { index: panel.index });
		} else if (!declaration) {
			if (fence === '::::') {
				if (panel) error('Close the tab with ":::" before closing the group.', start);
				if (group.panels.length < 2) error('A tab group needs at least two alternatives.', group.start);
				group.end = offset;
				replace('group-end');
				group = panel = null;
			} else if (fence !== ':::') {
				error('Close tabs with ":::" and the group with "::::".', start);
			} else if (panel) {
				panel.end = start;
				if (!source.slice(panel.start, start).replace(/<!--[\s\S]*?-->/g, '').trim()) error('A tab cannot be empty. Explain when the step does not apply.', panel.declarationStart);
				replace('panel-end');
				panel = null;
			} else error('This closing marker has no open tab.', start);
		} else error(`Unknown or misplaced tab marker "${declaration}". Write callouts as GitHub-style alerts, for example > [!TIP] followed by quoted body text.`, start);
	}
	if (group) error('The tab group is unclosed. Close each tab with ":::" and the group with "::::".', group.start);
	let maskedSource = source;
	for (const replacement of [...replacements].reverse()) maskedSource = maskedSource.slice(0, replacement.start)
		+ ' '.repeat(replacement.end - replacement.start) + maskedSource.slice(replacement.end);
	nodes.length = 0;
	visit(markdownToMdast(maskedSource, { features: { gfm: true, frontmatter: true } }), null);
	for (const item of groups) {
		for (const tab of item.panels) {
			const end = tab.end ?? item.end ?? source.length;
			for (const { node } of nodes) {
				if (!node.position || node.position.start.offset < tab.start || node.position.start.offset >= end) continue;
				if (node.type === 'heading' || ['yaml', 'toml'].includes(node.type)
					|| (node.type === 'html' && /<(?:h[1-6]|nav)\b/i.test(node.value))) error('Tabs cannot contain headings, frontmatter, or navigation definitions. Keep the shared headings outside the group.', node.position.start.offset);
			}
			if (/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/.test(source.slice(tab.start, end).trimStart())) error('Frontmatter belongs at the start of content.md, not inside a tab.', tab.declarationStart);
		}
	}
	return { groups, diagnostics, replacements, maskedSource };
};

export const prepareContentTabs = (source, options = {}) => {
	const parsed = parseContentTabs(source, options);
	if (parsed.diagnostics.length) throw new Error(parsed.diagnostics[0].message);
	let result = source;
	for (const marker of [...parsed.replacements].reverse()) {
		const html = `<div data-norna-tabs-marker="${marker.kind}"${marker.index === undefined ? '' : ` data-index="${marker.index}"`}></div>`;
		result = result.slice(0, marker.start) + '\n' + html + '\n' + result.slice(marker.end);
	}
	return result;
};

export const groupRenderedTabs = (blocks, groups) => {
	const result = [];
	let group = null;
	let panel = null;
	const append = (block) => (panel ? panel.contentBlocks : result).push(block);
	for (const block of blocks) {
		if (block.type !== 'html') { append(block); continue; }
		const pattern = /<div data-norna-tabs-marker="([a-z-]+)"(?: data-index="(\d+)")?><\/div>/g;
		let cursor = 0;
		for (const match of block.html.matchAll(pattern)) {
			const before = block.html.slice(cursor, match.index);
			if (before.trim()) append({ type: 'html', html: before });
			const kind = match[1];
			if (kind === 'group-start') {
				const source = groups.find((item) => item.index === Number(match[2]));
				if (!source) throw new Error('Rendered tab group has no matching source.');
				group = { type: 'tabs', index: source.index, panels: [], source };
			} else if (kind === 'panel-start') {
				panel = { label: group.source.panels[Number(match[2])].label, contentBlocks: [] };
				group.panels.push(panel);
			} else if (kind === 'panel-end') panel = null;
			else if (kind === 'group-end') {
				const { source, ...resolved } = group;
				result.push(resolved);
				group = null;
			}
			cursor = match.index + match[0].length;
		}
		const after = block.html.slice(cursor);
		if (after.trim()) append({ type: 'html', html: after });
	}
	if (group || panel) throw new Error('Rendered tab group is incomplete.');
	return result;
};
