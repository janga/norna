export const tableRowHeaderMarker = '{row-header}';

const trailingMarkerPattern = /\s*\{row-header\}\s*$/u;

const getNodeText = (node) => {
	if (!node || typeof node !== 'object') return '';
	if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
	if (node.type === 'image') return node.alt ?? '';
	if (!Array.isArray(node.children)) return '';
	return node.children.map(getNodeText).join('');
};

const getUnescapedMarkerIndexes = (source) => {
	const indexes = [];
	let searchFrom = 0;
	while (searchFrom < source.length) {
		const index = source.indexOf(tableRowHeaderMarker, searchFrom);
		if (index < 0) break;
		let backslashes = 0;
		for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) {
			backslashes += 1;
		}
		if (backslashes % 2 === 0) indexes.push(index);
		searchFrom = index + tableRowHeaderMarker.length;
	}
	return indexes;
};

const getTextNodeMarkerCount = (node, source) => {
	if (node.type !== 'text' || !node.value?.includes(tableRowHeaderMarker)) return 0;
	const start = node.position?.start.offset;
	const end = node.position?.end.offset;
	const raw = Number.isInteger(start) && Number.isInteger(end)
		? source.slice(start, end)
		: node.value;
	return getUnescapedMarkerIndexes(raw).length;
};

const collectCellMarkers = (node, source, markers, location) => {
	if (!node || typeof node !== 'object') return;
	const count = getTextNodeMarkerCount(node, source);
	for (let index = 0; index < count; index += 1) {
		markers.push({ ...location, node });
	}
	for (const child of node.children ?? []) {
		collectCellMarkers(child, source, markers, location);
	}
};

const normalizeLabel = (value) => value.trim().replace(/\s+/gu, ' ').toLowerCase();

const issue = (code, node, message, fix, otherNode = null) => ({
	code,
	fix,
	message,
	node,
	otherNode,
});

export const inspectTableRowHeaders = (table, source = '') => {
	if (table?.type !== 'table') return { declared: false, issues: [], valid: false };

	const rows = table.children ?? [];
	const markers = [];
	for (const [rowIndex, row] of rows.entries()) {
		for (const [columnIndex, cell] of (row.children ?? []).entries()) {
			collectCellMarkers(cell, source, markers, { cell, columnIndex, rowIndex });
		}
	}

	if (markers.length === 0) return { declared: false, issues: [], valid: false };

	const issues = [];
	const declaration = markers[0];
	for (const repeated of markers.slice(1)) {
		issues.push(issue(
			'repeated-table-row-header-marker',
			repeated.cell,
			`A table may contain ${tableRowHeaderMarker} only once.`,
			`Keep ${tableRowHeaderMarker} only in the first column heading.`,
			declaration.cell,
		));
	}

	const firstHeadingCell = rows[0]?.children?.[0];
	if (declaration.rowIndex !== 0 || declaration.columnIndex !== 0) {
		issues.push(issue(
			'invalid-table-row-header-column',
			declaration.cell,
			`${tableRowHeaderMarker} must appear in the first column heading.`,
			`Move ${tableRowHeaderMarker} to the end of the first heading cell.`,
		));
	} else if (!getNodeText(firstHeadingCell).trim().endsWith(tableRowHeaderMarker)) {
		issues.push(issue(
			'invalid-table-row-header-marker-position',
			firstHeadingCell,
			`${tableRowHeaderMarker} must be the final content in the first column heading.`,
			`Move ${tableRowHeaderMarker} to the end of the first heading cell.`,
		));
	}

	const headingLabel = getNodeText(firstHeadingCell).replace(trailingMarkerPattern, '').trim();
	if (!headingLabel) {
		issues.push(issue(
			'empty-table-row-header-heading',
			firstHeadingCell ?? table,
			'The row-header column needs a visible column heading.',
			`Write a heading before ${tableRowHeaderMarker}, for example "Feature ${tableRowHeaderMarker}".`,
		));
	}

	if (rows.length < 2) {
		issues.push(issue(
			'empty-table-row-header-body',
			table,
			'A table with a row-header declaration needs at least one body row.',
			'Add a body row or remove the row-header declaration.',
		));
	}

	const labels = new Map();
	for (const row of rows.slice(1)) {
		const cell = row.children?.[0];
		if (!cell) {
			issues.push(issue(
				'missing-table-row-header',
				row,
				'This table row has no cell in the row-header column.',
				'Add a unique row label in the first column.',
			));
			continue;
		}

		const label = getNodeText(cell).trim().replace(/\s+/gu, ' ');
		if (!label) {
			issues.push(issue(
				'empty-table-row-header',
				cell,
				'This table row has an empty row header.',
				'Add a unique row label in the first column.',
			));
			continue;
		}

		const normalizedLabel = normalizeLabel(label);
		const existing = labels.get(normalizedLabel);
		if (existing) {
			issues.push(issue(
				'duplicate-table-row-header',
				cell,
				`Row header "${label}" is repeated.`,
				'Give every row a unique label so its header association is unambiguous.',
				existing,
			));
			continue;
		}
		labels.set(normalizedLabel, cell);
	}

	return {
		declared: true,
		firstHeadingCell,
		issues,
		markerNode: declaration.node,
		valid: issues.length === 0,
	};
};

const formatDiagnostic = (entry, options) => {
	const lineOffset = options.lineOffset ?? 0;
	const line = lineOffset + (entry.node?.position?.start.line ?? 1);
	const otherLine = entry.otherNode
		? lineOffset + (entry.otherNode.position?.start.line ?? 1)
		: null;
	const related = otherLine && otherLine !== line ? ` The first occurrence is on line ${otherLine}.` : '';
	const label = options.label ?? 'Markdown';
	return {
		code: entry.code,
		fix: entry.fix,
		line,
		message: `${label} line ${line}: ${entry.message}${related}`,
		offset: entry.node?.position?.start.offset ?? 0,
	};
};

export const getTableRowHeaderDiagnostics = (tree, options = {}) => {
	const diagnostics = [];
	const source = options.source ?? '';
	const visit = (node) => {
		if (!node || typeof node !== 'object') return;
		if (node.type === 'table') {
			const inspection = inspectTableRowHeaders(node, source);
			diagnostics.push(...inspection.issues.map((entry) => formatDiagnostic(entry, options)));
		}
		for (const child of node.children ?? []) visit(child);
	};
	visit(tree);
	return diagnostics;
};

export const applyTableRowHeaderDeclaration = (table, context) => {
	const inspection = inspectTableRowHeaders(table, context.source);
	if (!inspection.valid || !inspection.markerNode) return false;

	context.setProperty(
		inspection.markerNode,
		'value',
		inspection.markerNode.value.replace(trailingMarkerPattern, ''),
	);
	context.setProperty(table, 'data', {
		...(table.data ?? {}),
		hProperties: {
			...(table.data?.hProperties ?? {}),
			'data-row-headers': 'true',
		},
	});
	return true;
};
