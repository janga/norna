import { defineMdastPlugin } from 'satteri';
import { nornaBlockTypes } from './norna-markdown-blocks.mjs';
import projectConfig from './project-config.mjs';
import { getSemanticCalloutMarker } from './semantic-callouts.mjs';

const stateKey = 'nornaMarkdownRender';

const getState = (context) => {
	if (!context.data[stateKey]) {
		context.data[stateKey] = { blockIndex: 0, calloutIndex: 0, regionIndex: 0 };
	}
	return context.data[stateKey];
};

const calloutLabelKeys = Object.freeze({
	CAUTION: 'calloutCaution',
	DANGER: 'calloutDanger',
	IMPORTANT: 'calloutImportant',
	NOTE: 'calloutNote',
	TIP: 'calloutTip',
	WARNING: 'calloutWarning',
});

const hasBlockquoteAncestor = (node, context) => {
	let parent = context.parent(node);
	while (parent) {
		if (parent.type === 'blockquote') return true;
		parent = context.parent(parent);
	}
	return false;
};

export const nornaMarkdownRenderPlugin = defineMdastPlugin({
	name: 'norna-markdown-render',
	blockquote(node, context) {
		const marker = getSemanticCalloutMarker(node);
		if (
			!marker
			|| marker.malformed
			|| !marker.supported
			|| marker.rawType !== marker.type
			|| marker.title
			|| !marker.hasBody
			|| hasBlockquoteAncestor(node, context)
		) return;

		const state = getState(context);
		const labelKey = calloutLabelKeys[marker.type];
		const label = projectConfig.locale.labels[labelKey];
		const labelId = `norna-callout-label-${state.calloutIndex}`;
		state.calloutIndex += 1;

		context.setProperty(node, 'data', {
			hName: 'aside',
			hProperties: {
				'aria-labelledby': labelId,
				className: ['norna-callout', `norna-callout-${marker.type.toLowerCase()}`],
				role: 'note',
			},
		});

		if (!marker.firstTextRemainder && marker.firstParagraph.children.length === 1) {
			context.removeChildAt(node, 0);
		} else {
			context.setProperty(marker.firstText, 'value', marker.firstTextRemainder);
		}
		context.prependChild(node, {
			type: 'paragraph',
			data: {
				hProperties: {
					className: ['norna-callout-label'],
					id: labelId,
				},
			},
			children: [{ type: 'text', value: label }],
		});
	},
	code(node, context) {
		if (!nornaBlockTypes.has(node.lang)) return;

		const state = getState(context);
		const blockIndex = state.blockIndex;
		state.blockIndex += 1;
		context.replaceNode(node, {
			type: 'html',
			value: `<norna-block data-index="${blockIndex}"></norna-block>`,
		});
	},
	heading(node, context) {
		if (node.depth !== 1 && node.depth !== 2) return;
		const state = getState(context);
		const regionIndex = state.regionIndex;
		state.blockIndex = 0;
		state.regionIndex += 1;
		context.replaceNode(node, {
			type: 'html',
			value: `<norna-region data-index="${regionIndex}"></norna-region>`,
		});
	},
});
