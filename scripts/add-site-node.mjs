import path from 'node:path';
import { invocationRoot, siteDir, siteProjectRoot } from './lib/site-paths.mjs';
import { createSiteNode, planSiteNodeCreation } from './lib/site-node-create.mjs';
import { parsePlacementArguments, confirmCliRenumbering, describeRenumbering } from './lib/page-placement-cli.mjs';

const usage = `Usage:
  norna page:add <title> [--parent <path>] [--first | --last] [--slug <slug>]
  norna page:add <title> --before <page-url> | --after <page-url>

Options: --order <integer>, --dry-run, --allow-renumber
Without a placement, append under --parent or the current page/site directory.
Before/after infer the parent. --order cannot accompany a relative placement.`;
const display = filename => path.relative(siteProjectRoot, filename) || filename;
try {
 const [kind, ...args] = process.argv.slice(2);
 if (kind !== 'page') throw new Error(usage);
 const options = parsePlacementArguments(args);
 if (options.help) { console.log(usage); process.exit(0); }
 if (options.write || options.noAliases) throw new Error('page:add uses --dry-run; --write and --no-aliases are page:move options.');
 const title = options.positionals.join(' ').trim();
 if (!title) throw new Error(`A one-line page title is required.\n${usage}`);
 const plan = await planSiteNodeCreation({ siteRoot: siteDir, kind, title, slug: options.slug, order: options.order,
  parentPath: options.parent, invocationDirectory: invocationRoot,
  placement: options.order !== null ? null : options.placement, targetPath: options.target });
 console.log(`Page: ${title}\nSource: ${display(plan.destination)}\nURL: ${plan.url}\nOrder: ${plan.order}`);
 const renumbering = describeRenumbering(plan.orderChanges, display);
 if (renumbering) console.log(renumbering);
 if (options.dryRun) { console.log(`Would create page "${title}". Dry run only. No files changed.`); process.exit(0); }
 if (!await confirmCliRenumbering(plan.orderChanges, options)) { console.log('Cancelled. No files changed.'); process.exit(0); }
 const result = await createSiteNode(plan, { allowRenumber: true });
 console.log(`Created page "${title}" at ${display(plan.destination)}. ${result.renumberedPages} existing sibling page(s) renumbered.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
