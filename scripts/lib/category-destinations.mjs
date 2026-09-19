import { getSiteNavigationTree } from './site-navigation-tree.mjs';
import { getSiteNodePathname } from './site-page-urls.mjs';

// Accept the same normalized nodes as navigation; excluded ancestors exclude
// their whole subtree, including category destinations.
export const createCategoryDestinationModel = (nodes) => {
	const destinations = [];
	const diagnostics = [];
	const visit = (branch) => {
		const { node } = branch;
		if (node.navigation?.listed === false) return false;
		// Empty child categories retain their URLs but do not become menu choices
		// or redirect targets for a parent that still has reachable pages.
		const children = branch.children.filter(visit);
		if (node.kind !== 'category') return true;
		if (children.length === 0) {
			const source = node.categorySourceLabel ?? node.nodeLabel ?? node.pageDirectory;
			diagnostics.push({
				code: 'category-without-listed-content',
				severity: 'warning',
				message: `${source} has no listed reachable content page.`,
				fix: 'Add a listed page to include this category in navigation, or leave it empty while reorganizing.',
			});
		}
		const first = children[0]?.node;
		destinations.push({
			category: node,
			pathname: getSiteNodePathname(node),
			kind: first?.kind === 'page' ? 'redirect' : 'listing',
			target: first?.kind === 'page' ? first : null,
			children: children.map(({ node: child }) => child),
		});
		return children.length > 0;
	};
	getSiteNavigationTree(nodes.map((node) => ({ node }))).forEach(visit);
	return {
		destinations,
		byPathname: new Map(destinations.map((destination) => [destination.pathname, destination])),
		diagnostics,
	};
};

export const assertCategoryDestinationModel = (model) => {
	const errors = model.diagnostics.filter(({ severity }) => severity === 'error');
	if (errors.length) {
		throw new Error(errors.map(({ message, fix }) => `${message}\n${fix}`).join('\n'));
	}
	return model;
};
