import { defineMdastPlugin } from 'satteri';
import { extractInlineNoteDiagnostics, noteTargetKey } from './markdown-notes.mjs';
import projectConfig from './project-config.mjs';

const stateKey = 'nornaMarkdownNotes';
const stateFor = (context) => {
	if (!context.data[stateKey]) {
		const model = extractInlineNoteDiagnostics(context.source, { label: context.fileURL?.pathname ?? 'Markdown' });
		if (model.errors.length) throw new Error(model.errors[0].message);
		for (const warning of model.warnings) context.report({ message: warning.message, severity: 'warning' });
		context.data[stateKey] = {
			notes: new Map(model.notes.map((note) => [note.identifier, note])),
			definitions: new Map(model.definitions.map((node) => [node.identifier, node])),
		};
	}
	return context.data[stateKey];
};
const element = (tag, properties, children) => ({
	type: 'blockquote', data: { hName: tag, hProperties: properties }, children,
});
const backLabel = (marker) => projectConfig.locale.labels.footnoteBackReference.replace('{reference}', marker);
const text = (value) => ({ type: 'text', value });

export const marginNoteLayoutDeclarations = [
	'grid-template-columns: minmax(0, 1fr) var(--layout-note-width);',
	'width: calc(100% + var(--layout-note-width) + var(--layout-note-gap));',
].join('\n');

// Register before the region/block renderer: note bodies and definitions must
// be resolved before heading replacement and before Satteri numbers footnotes.
export const nornaNotesRenderPlugin = defineMdastPlugin({
	name: 'norna-markdown-notes',
	paragraph(node, context) {
		if (context.parent(node)?.type !== 'root') return;
		const state = stateFor(context);
		const notes = [];
		const visit = (child) => {
			if (child.type === 'footnoteReference' && state.notes.has(child.identifier)) notes.push(state.notes.get(child.identifier));
			for (const nested of child.children ?? []) visit(nested);
		};
		visit(node);
		if (!notes.length) return;
		const bodies = notes.map((note) => element('aside', {
			className: ['section-note', 'section-note-margin'], id: note.id, role: 'note',
			'aria-label': `${projectConfig.locale.labels.note} ${note.marker}`,
		}, [{
			type: 'paragraph', data: { hName: 'span', hProperties: { className: ['section-note-number'] } },
			children: [{ type: 'link', url: `#${note.referenceId}`, data: { hProperties: { id: `${note.id}:label`, 'aria-label': backLabel(note.marker) } }, children: [text(note.marker)] }],
		}, {
			...state.definitions.get(note.identifier).children[0],
			data: { hName: 'span', hProperties: { className: ['section-note-content'] } },
		}]));
		context.wrapNode(node, element('div', { className: ['section-note-paragraph'] }, [
			element('div', { className: ['section-note-stack'] }, bodies),
		]));
	},
	footnoteReference(node, context) {
		const note = stateFor(context).notes.get(node.identifier);
		if (!note) {
			context.setProperty(node, 'identifier', `norna:${noteTargetKey(node.identifier)}`);
			return;
		}
		context.replaceNode(node, {
			type: 'emphasis', data: { hName: 'sup', hProperties: { className: ['section-note-ref'] } },
			children: [{ type: 'link', url: `#${note.id}`, data: { hProperties: {
				id: note.referenceId, 'aria-describedby': note.id,
			} }, children: [text(note.marker)] }],
		});
	},
	footnoteDefinition(node, context) {
		stateFor(context);
		if (node.identifier.startsWith('margin:')) context.removeNode(node);
		else context.setProperty(node, 'identifier', `norna:${noteTargetKey(node.identifier)}`);
	},
});
