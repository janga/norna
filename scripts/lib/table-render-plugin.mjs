import { defineHastPlugin } from 'satteri';

export const nornaTableRenderPlugin = defineHastPlugin({
	name: 'norna-table-render',
	element: {
		filter: ['table'],
		visit(node, context) {
			context.replaceNode(node, {
				type: 'element',
				tagName: 'div',
				properties: {
					className: ['norna-table-frame', 'content-block-note-lane-boundary'],
					'data-table-frame': '',
				},
				children: [{
					type: 'element',
					tagName: 'div',
					properties: {
						className: ['norna-table-scroll'],
						'data-table-scroll': '',
						tabIndex: 0,
					},
					children: [{
						type: 'element',
						tagName: node.tagName,
						properties: { ...(node.properties ?? {}) },
						children: [...(node.children ?? [])],
					}],
				}],
			});
		},
	},
});
