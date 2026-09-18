/**
 * @typedef {{ openPaths: string[], sectionOpenByPath: Record<string, boolean> }} DisclosureState
 * @typedef {DisclosureState & { scrollTop: number }} NavigationState
 * @typedef {{ pagePath?: string, currentBranch?: string, currentPage?: string }} BranchData
 * @typedef {{ onArrival?: boolean, preserveCurrentPage?: boolean, preserveCurrentOutline?: boolean }} DisclosurePolicy
 */

// Keep this factory self-contained: the early inline script embeds its source,
// while the deferred runtime calls it as a normal module. No imported or outer
// values may be referenced inside it.
export function createNavigationStateHelpers() {
	/** @param {'desktop' | 'mobile'} scope @param {string} root @param {string} sharedRoot */
	const storageKeys = (scope, root = '/', sharedRoot = root) => ({
		stateKey: `norna:tree-navigation:${scope}:${root}`,
		sharedStateKey: `norna:tree-navigation:shared:${sharedRoot}`,
	});
	/** @param {string | null} value @returns {NavigationState} */
	const parseState = (value) => {
		try {
			const parsedState = JSON.parse(value ?? '{}');
			return {
				openPaths: Array.isArray(parsedState.openPaths) ? parsedState.openPaths : [],
				sectionOpenByPath: parsedState.sectionOpenByPath
					&& typeof parsedState.sectionOpenByPath === 'object'
					? Object.fromEntries(Object.entries(parsedState.sectionOpenByPath)
						.filter((entry) => typeof entry[1] === 'boolean'))
					: {},
				scrollTop: Number.isFinite(Number(parsedState.scrollTop)) ? Number(parsedState.scrollTop) : 0,
			};
		} catch {
			return { openPaths: [], sectionOpenByPath: {}, scrollTop: 0 };
		}
	};
	/** @param {string | null} localSource @param {string | null} sharedSource */
	const initialState = (localSource, sharedSource) => {
		const local = parseState(localSource);
		return {
			local,
			// An existing invalid shared record is empty, not a local fallback.
			disclosure: sharedSource === null ? local : parseState(sharedSource),
			hasSavedState: localSource !== null || sharedSource !== null,
		};
	};
	/** @param {DisclosureState} state @param {BranchData} branch @param {DisclosurePolicy} policy */
	const pageIsOpen = (state, branch, policy = {}) => (
		(Boolean(policy.onArrival) && branch.currentBranch === 'true'
			&& (!policy.preserveCurrentPage || branch.currentPage !== 'true'))
		|| state.openPaths.includes(branch.pagePath ?? '')
	);
	/** @param {DisclosureState} state @param {BranchData} branch @param {DisclosurePolicy} policy */
	const sectionsAreOpen = (state, branch, policy = {}) => {
		const storedOpen = state.sectionOpenByPath[branch.pagePath ?? ''];
		if (policy.onArrival && branch.currentPage === 'true'
			&& !(policy.preserveCurrentOutline && typeof storedOpen === 'boolean')) return true;
		return typeof storedOpen === 'boolean' ? storedOpen : branch.currentPage === 'true';
	};
	return { storageKeys, parseState, initialState, pageIsOpen, sectionsAreOpen };
}
