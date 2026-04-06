import { Command } from 'commander';
import { getAllCapabilities } from '../../chat/tools/registry.js';
import { jsonSuccess } from '../../output/json.js';
import { renderTable, renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { filterCapabilities, getCategories, findCapability, getSuggestions } from '../../capabilities/filter.js';
import type { CanonicalCapability } from '../../capabilities/types.js';

// Re-export for consumers
export { getCategories } from '../../capabilities/filter.js';

function formatParamType(p: { type: string | object }): string {
  if (typeof p.type === 'object') return 'object';
  return p.type;
}

function formatParamSummary(params: Array<{ name: string; required: boolean }>): string {
  if (params.length === 0) return '(none)';
  return params
    .map((p) => (p.required ? p.name : `[${p.name}]`))
    .join(', ');
}

export function registerToolCommands(program: Command): void {
  let _caps: CanonicalCapability[] | null = null;
  function getCaps(): CanonicalCapability[] {
    if (!_caps) _caps = getAllCapabilities();
    return _caps;
  }

  const tools = program
    .command('tools')
    .description('Discover available AI tools and capabilities');

  tools
    .command('list')
    .description('List all available tools')
    .option('-c, --category <category>', 'Filter by category (e.g. event, space, tickets)')
    .option('--surface <surface>', 'Filter by surface (aiTool, cliCommand, slashCommand)')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      try {
        const entries = filterCapabilities(getCaps(), {
          category: opts.category,
          surface: opts.surface,
        });

        if (opts.category && entries.length === 0) {
          const available = getCategories(getCaps()).join(', ');
          throw new Error(`No tools in category "${opts.category}". Available categories: ${available}`);
        }

        if (opts.json) {
          const data = entries.map((t) => ({
            name: t.name,
            category: t.category,
            description: t.description,
            destructive: t.destructive,
            backendType: t.backendType,
            backendService: t.backendService,
            surfaces: [...t.surfaces],
            params: formatParamSummary(t.params),
          }));
          console.log(jsonSuccess(data, { total: data.length }));
        } else {
          const rows = entries.map((t) => [
            t.name,
            t.category,
            t.surfaces.join(', '),
            t.description,
            t.destructive ? 'yes' : '',
          ]);
          console.log(renderTable(['Name', 'Category', 'Surfaces', 'Description', 'Destructive'], rows, { truncate: 50 }));
          console.log(`\n${entries.length} tools. Use "lemonade tools info <name>" for details.`);
          if (!opts.category) {
            const cats = getCategories(getCaps());
            console.log(`Categories: ${cats.join(', ')}`);
          }
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });

  tools
    .command('info <name>')
    .description('Show detailed info for a specific tool')
    .option('--json', 'Output as JSON')
    .action((name: string, opts) => {
      try {
        const caps = getCaps();
        const cap = findCapability(caps, name) ??
          caps.find(c => c.displayName.toLowerCase() === name.toLowerCase());

        if (!cap) {
          const suggestions = getSuggestions(caps, name);
          const hint = suggestions.length
            ? `\nDid you mean: ${suggestions.join(', ')}`
            : '';
          throw new Error(`Tool "${name}" not found.${hint}`);
        }

        showToolInfo(cap, opts.json);
      } catch (error) {
        handleError(error, opts.json);
      }
    });

  tools
    .command('categories')
    .description('List tool categories with counts')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      try {
        const caps = getCaps();
        const counts: Record<string, number> = {};
        for (const cap of caps) {
          counts[cap.category] = (counts[cap.category] || 0) + 1;
        }

        const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));

        if (opts.json) {
          console.log(jsonSuccess(sorted.map(([category, count]) => ({ category, count })), { total: sorted.length }));
        } else {
          const rows = sorted.map(([cat, count]) => [cat, String(count)]);
          console.log(renderTable(['Category', 'Tools'], rows));
          console.log(`\n${caps.length} tools in ${sorted.length} categories.`);
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });
}

function showToolInfo(cap: CanonicalCapability, json: boolean): void {
  if (json) {
    console.log(
      jsonSuccess({
        name: cap.name,
        displayName: cap.displayName,
        category: cap.category,
        description: cap.description,
        destructive: cap.destructive,
        backendType: cap.backendType,
        backendService: cap.backendService,
        backendResolver: cap.backendResolver ?? null,
        surfaces: [...cap.surfaces],
        requiresSpace: cap.requiresSpace,
        requiresEvent: cap.requiresEvent,
        params: cap.params.map((p) => ({
          name: p.name,
          type: formatParamType(p),
          required: p.required,
          description: p.description,
          ...(p.enum ? { enum: p.enum } : {}),
          ...(p.default !== undefined ? { default: p.default } : {}),
        })),
      }),
    );
  } else {
    const pairs: Array<[string, string]> = [
      ['Name', cap.name],
      ['Display Name', cap.displayName],
      ['Category', cap.category],
      ['Description', cap.description],
      ['Destructive', cap.destructive ? 'yes' : 'no'],
      ['Backend Type', cap.backendType],
      ['Backend Service', cap.backendService],
      ['Backend Resolver', cap.backendResolver ?? '(none)'],
      ['Surfaces', cap.surfaces.join(', ')],
      ['Requires Space', cap.requiresSpace ? 'yes' : 'no'],
      ['Requires Event', cap.requiresEvent ? 'yes' : 'no'],
    ];
    if (cap.whenToUse) pairs.push(['When to Use', cap.whenToUse]);
    if (cap.tags?.length) pairs.push(['Tags', cap.tags.join(', ')]);
    console.log(renderKeyValue(pairs));

    if (cap.params.length > 0) {
      console.log('\nParameters:');
      const rows = cap.params.map((p) => [
        p.name,
        formatParamType(p),
        p.required ? 'required' : 'optional',
        p.description,
        p.enum ? p.enum.join(', ') : p.default !== undefined ? String(p.default) : '',
      ]);
      console.log(renderTable(['Name', 'Type', 'Required', 'Description', 'Values/Default'], rows, { truncate: 40 }));
    } else {
      console.log('\nNo parameters.');
    }
  }
}
