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
		const children = branch.children.filter(({ node: child }) => child.navigation?.listed !== false);
		const reachable = children.map(visit).some(Boolean);
		if (node.kind !== 'category') return true;
		if (!reachable) {
			const source = node.categorySourceLabel ?? node.nodeLabel ?? node.pageDirectory;
			diagnostics.push({
				code: 'category-without-listed-content',
				severity: 'error',
				message: `${source} has no listed reachable content page.`,
				fix: 'Add a listed page under this category, or remove the category.',
			});
			return false;
		}
		const first = children[0].node;
		destinations.push({
			category: node,
			pathname: getSiteNodePathname(node),
			kind: first.kind === 'page' ? 'redirect' : 'listing',
			target: first.kind === 'page' ? first : null,
			children: children.map(({ node: child }) => child),
		});
		return true;
	};
	getSiteNavigationTree(nodes.map((node) => ({ node }))).forEach(visit);
	return {
		destinations,
		byPathname: new Map(destinations.map((destination) => [destination.pathname, destination])),
		diagnostics,
	};
};

export const assertCategoryDestinationModel = (model) => {
	if (model.diagnostics.length) {
		throw new Error(model.diagnostics.map(({ message, fix }) => `${message}\n${fix}`).join('\n'));
	}
	return model;
};
