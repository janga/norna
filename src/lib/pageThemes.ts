import { selectPageTheme } from '../../scripts/lib/theme-packages.mjs';
import { siteDir } from '../../scripts/lib/site-paths.mjs';

export const getPageTheme = async (pageDirectory: string) => {
	const { selected } = await selectPageTheme({ siteRoot: siteDir, pageDirectory });
	return { id: selected.label, data: selected.config };
};
