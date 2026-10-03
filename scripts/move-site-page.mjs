import path from 'node:path';
import { applyPageMovePlan } from './lib/page-move-apply.mjs';
import { createPageMovePlan, formatPageMovePlan } from './lib/page-move-plan.mjs';
import { planEditorPagePlacement, applyEditorPagePlacement } from './lib/editor-page-placement.mjs';
import { parsePlacementArguments, confirmCliRenumbering, describeRenumbering } from './lib/page-placement-cli.mjs';
import { readEditorLinkState } from './lib/editor-site-links.mjs';
import { sitePagesDir, sitePagesLabel, siteProjectRoot, siteDir } from './lib/site-paths.mjs';

const usage = `Usage:
  norna page:move <old-url> <new-url> [--order <integer>]
  norna page:move <page-url> --before <target-url> | --after <target-url>
  norna page:move <page-url> --parent <parent-url> [--first | --last]

Options: --no-aliases, --write, --dry-run, --allow-renumber
Dry run unless --write is present. The URL-to-URL form also reconciles a page
already moved by hand. Renumbering other pages requires confirmation.`;
const display = filename => path.relative(siteProjectRoot, filename) || filename;
try {
 const options = parsePlacementArguments(process.argv.slice(2));
 if (options.help) { console.log(usage); process.exit(0); }
 if (options.slug !== null) throw new Error('Use the new URL to change a slug with page:move.');
 const relative = options.placement !== null;
 if (options.positionals.length !== (relative ? 1 : 2)) throw new Error(usage);
 if (relative && options.order !== null) throw new Error('Do not combine --order with a placement selector.');
 const state = await readEditorLinkState({ siteRoot: siteDir });
 if (state.incomplete.length) throw new Error(state.incomplete.join('\n'));
 let plan;
 if (relative) {
  const find = url => state.structure.nodes.find(node => (node.isHome ? '/' : `/${node.pagePath}/`) === url);
  const source = find(options.positionals[0]), target = find(options.target);
  if (!source || !target) throw new Error('Choose existing source and target page URLs.');
  plan = await planEditorPagePlacement({ siteRoot: siteDir, sourcePath: source.contentPath, targetPath: target.contentPath,
   placement: options.placement, preserveAliases: options.preserveAliases });
  console.log(`Page placement: ${plan.sourceUrl} ${options.placement} ${options.target}\nOrder: ${plan.sourceOrder}`);
  if (plan.movePreview) console.log(formatPageMovePlan(plan.movePreview, display).join('\n'));
  else if (plan.orderChanges.length) console.log(describeRenumbering(plan.orderChanges, display));
 } else {
  plan = await createPageMovePlan({ from: options.positionals[0], to: options.positionals[1], order: options.order,
   preserveAliases: options.preserveAliases, graph: state.graph, publicFiles: state.publicFiles,
   siteStructure: state.structure, sitePagesDir, sitePagesLabel, generatedRoutes: state.generatedRoutes });
  console.log(formatPageMovePlan(plan, display).join('\n'));
 }
 if (!options.write) { console.log('\nDry run only. Run with --write to apply this plan.'); process.exit(0); }
 if (!await confirmCliRenumbering(plan.orderChanges, options)) { console.log('Cancelled. No files changed.'); process.exit(0); }
 if (relative) await applyEditorPagePlacement(plan, { allowRenumber: true });
 else await applyPageMovePlan(plan, { siteRoot: siteDir, generatedRoutes: state.generatedRoutes, allowRenumber: true });
 console.log(`Page move completed: ${plan.sourceUrl ?? plan.from} -> ${plan.destinationUrl ?? plan.to}. ${plan.orderChanges.length} existing sibling page(s) renumbered.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
