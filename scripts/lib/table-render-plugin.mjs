import { defineHastPlugin } from 'satteri';

const transformTableSection = (section, { columnHeaders = false, rowHeaders = false } = {}) => ({
	...section,
	children: (section.children ?? []).map((child) => {
		if (child.type !== 'element' || child.tagName !== 'tr') return child;
		let columnIndex = 0;
		return {
			...child,
			children: (child.children ?? []).map((cell) => {
				if (cell.type !== 'element' || (cell.tagName !== 'th' && cell.tagName !== 'td')) return cell;
				const currentColumn = columnIndex;
				columnIndex += 1;
				if (columnHeaders) {
					return {
						...cell,
						properties: { ...(cell.properties ?? {}), scope: 'col' },
					};
				}
				if (rowHeaders && currentColumn === 0) {
					return {
						...cell,
						tagName: 'th',
						properties: { ...(cell.properties ?? {}), scope: 'row' },
					};
				}
				return cell;
			}),
		};
	}),
});

const transformRowHeaderTable = (node) => ({
	...node,
	children: (node.children ?? []).map((child) => {
		if (child.type !== 'element') return child;
		if (child.tagName === 'thead') return transformTableSection(child, { columnHeaders: true });
		if (child.tagName === 'tbody') return transformTableSection(child, { rowHeaders: true });
		return child;
	}),
});

export const nornaTableRenderPlugin = defineHastPlugin({
	name: 'norna-table-render',
	element: {
		filter: ['table'],
		visit(node, context) {
			const hasRowHeaders = node.properties?.['data-row-headers'] === 'true';
			const table = hasRowHeaders ? transformRowHeaderTable(node) : node;
			context.replaceNode(node, {
				type: 'element',
				tagName: 'div',
				properties: {
					className: ['norna-table-frame', 'content-block-note-lane-boundary'],
					'data-table-frame': '',
					...(hasRowHeaders ? { 'data-table-row-headers': 'true' } : {}),
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
						tagName: table.tagName,
						properties: { ...(table.properties ?? {}) },
						children: [...(table.children ?? [])],
					}],
				}],
			});
		},
	},
});
