import { Command } from 'commander';
import { buildToolRegistry } from '../../chat/tools/registry.js';
import { jsonSuccess } from '../../output/json.js';
import { renderTable, renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import type { ToolDef, ToolParam } from '../../chat/providers/interface.js';

/** Get the explicit category from a ToolDef. */
export function getToolCategory(tool: ToolDef): string {
  return tool.category;
}

/** Get sorted unique categories from a tool record. */
export function getCategories(tools: Record<string, ToolDef>): string[] {
  const cats = new Set<string>();
  for (const tool of Object.values(tools)) {
    cats.add(tool.category);
  }
  return [...cats].sort();
}

function formatParamType(p: ToolParam): string {
  if (typeof p.type === 'object') return 'object';
  return p.type;
}

function formatParamSummary(params: ToolParam[]): string {
  if (params.length === 0) return '(none)';
  return params
    .map((p) => (p.required ? p.name : `[${p.name}]`))
    .join(', ');
}

export function registerToolCommands(program: Command): void {
  // Lazy-init: registry is built on first subcommand invocation, then cached.
  let _registry: Record<string, ToolDef> | null = null;
  function getRegistry(): Record<string, ToolDef> {
    if (!_registry) _registry = buildToolRegistry();
    return _registry;
  }

  const tools = program
    .command('tools')
    .description('Discover available AI tools and capabilities');

  tools
    .command('list')
    .description('List all available tools')
    .option('-c, --category <category>', 'Filter by category (e.g. event, space, tickets)')
    .option('--json', 'Output as JSON')
    .action((opts) => {
      try {
        const registry = getRegistry();
        let entries = Object.values(registry);

        if (opts.category) {
          const cat = opts.category.toLowerCase();
          entries = entries.filter((t) => getToolCategory(t) === cat);
          if (entries.length === 0) {
            const available = getCategories(registry).join(', ');
            throw new Error(`No tools in category "${opts.category}". Available categories: ${available}`);
          }
        }

        entries.sort((a, b) => a.name.localeCompare(b.name));

        if (opts.json) {
          const data = entries.map((t) => ({
            name: t.name,
            category: getToolCategory(t),
            description: t.description,
            destructive: t.destructive,
            params: formatParamSummary(t.params),
          }));
          console.log(jsonSuccess(data, { total: data.length }));
        } else {
          const rows = entries.map((t) => [
            t.name,
            getToolCategory(t),
            t.description,
            t.destructive ? 'yes' : '',
          ]);
          console.log(renderTable(['Name', 'Category', 'Description', 'Destructive'], rows, { truncate: 60 }));
          console.log(`\n${entries.length} tools. Use "lemonade tools info <name>" for details.`);
          if (!opts.category) {
            const cats = getCategories(registry);
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
        const registry = getRegistry();
        const tool = registry[name];

        if (!tool) {
          // Try fuzzy match
          const match = Object.values(registry).find(
            (t) =>
              t.displayName.toLowerCase() === name.toLowerCase() ||
              t.name.toLowerCase() === name.toLowerCase(),
          );
          if (!match) {
            const suggestions = Object.keys(registry)
              .filter((k) => k.toLowerCase().includes(name.toLowerCase()))
              .slice(0, 5);
            const hint = suggestions.length
              ? `\nDid you mean: ${suggestions.join(', ')}`
              : '';
            throw new Error(`Tool "${name}" not found.${hint}`);
          }
          // Recurse with the found name
          showToolInfo(match, opts.json);
          return;
        }

        showToolInfo(tool, opts.json);
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
        const registry = getRegistry();
        const counts: Record<string, number> = {};
        for (const tool of Object.values(registry)) {
          const cat = getToolCategory(tool);
          counts[cat] = (counts[cat] || 0) + 1;
        }

        const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));

        if (opts.json) {
          console.log(jsonSuccess(sorted.map(([category, count]) => ({ category, count })), { total: sorted.length }));
        } else {
          const rows = sorted.map(([cat, count]) => [cat, String(count)]);
          console.log(renderTable(['Category', 'Tools'], rows));
          console.log(`\n${Object.keys(registry).length} tools in ${sorted.length} categories.`);
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });
}

function showToolInfo(tool: ToolDef, json: boolean): void {
  if (json) {
    console.log(
      jsonSuccess({
        name: tool.name,
        displayName: tool.displayName,
        category: getToolCategory(tool),
        description: tool.description,
        destructive: tool.destructive,
        params: tool.params.map((p) => ({
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
      ['Name', tool.name],
      ['Display Name', tool.displayName],
      ['Category', getToolCategory(tool)],
      ['Description', tool.description],
      ['Destructive', tool.destructive ? 'yes' : 'no'],
    ];
    console.log(renderKeyValue(pairs));

    if (tool.params.length > 0) {
      console.log('\nParameters:');
      const rows = tool.params.map((p) => [
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
