import { createInterface } from 'node:readline/promises';
import { parsePageOrder, assertRenumberingAllowed, describeRenumbering } from './page-order.mjs';

export const parsePlacementArguments = (args) => {
 const options = { positionals: [], order: null, parent: null, slug: null, placement: null, target: null, preserveAliases: true };
 const seen = new Set();
 const flags = { '--help': 'help', '-h': 'help', '--dry-run': 'dryRun', '--write': 'write', '--allow-renumber': 'allowRenumber', '--no-aliases': 'noAliases', '--first': 'first', '--last': 'last' };
 const values = { '--parent': 'parent', '--slug': 'slug', '--order': 'order', '--before': 'before', '--after': 'after' };
 for (let i = 0; i < args.length; i++) {
  const [name, ...tail] = args[i].split('=');
  const key = flags[name] ?? values[name];
  if (!key) {
   if (args[i].startsWith('-')) throw new Error(`Unknown option: ${args[i]}`);
   options.positionals.push(args[i]); continue;
  }
  if (seen.has(key)) throw new Error(`${name} may be specified only once.`);
  seen.add(key);
  if (flags[name]) {
   if (tail.length) throw new Error(`${name} does not take a value.`);
   options[key] = true;
  } else {
   const value = tail.length ? tail.join('=') : args[++i];
   if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
   options[key] = value;
  }
 }
 if (options.order !== null) {
  if (!/^\d+$/.test(options.order)) throw new Error('--order must be a positive integer.');
  options.order = parsePageOrder(Number(options.order), '--order');
 }
 const positions = ['before', 'after', 'first', 'last'].filter(key => seen.has(key));
 if (positions.length > 1) throw new Error('Choose only one of --before, --after, --first or --last.');
 options.placement = positions[0] ?? (options.parent !== null ? 'last' : null);
 if ((options.before || options.after) && options.parent !== null) throw new Error('--before/--after determine the parent; do not combine them with --parent.');
 if (positions.length && options.order !== null) throw new Error('Do not combine --order with a placement selector.');
 if (options.dryRun && options.write) throw new Error('Choose --dry-run or --write, not both.');
 options.target = options.before ?? options.after ?? options.parent ?? '/';
 options.preserveAliases = !options.noAliases;
 return options;
};

export const confirmCliRenumbering = async (changes, options) => {
 if (!changes.length) return true;
 if (options.allowRenumber) return true;
 if (!process.stdin.isTTY || !process.stdout.isTTY) assertRenumberingAllowed(changes, false);
 const prompt = createInterface({ input: process.stdin, output: process.stdout });
 try { return /^(y|yes)$/i.test((await prompt.question('Apply these order changes? [y/N] ')).trim()); }
 finally { prompt.close(); }
};
export { describeRenumbering };
