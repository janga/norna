import { defineMdastPlugin } from 'satteri';
import { nornaBlockTypes } from './norna-markdown-blocks.mjs';

const stateKey = 'nornaMarkdownRender';

const getState = (context) => {
	if (!context.data[stateKey]) {
		context.data[stateKey] = { blockIndex: 0, regionIndex: 0 };
	}
	return context.data[stateKey];
};

export const nornaMarkdownRenderPlugin = defineMdastPlugin({
	name: 'norna-markdown-render',
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
