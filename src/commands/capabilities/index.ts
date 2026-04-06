import { Command } from 'commander';
import { createRequire } from 'module';
import { jsonSuccess } from '../../output/json.js';
import { renderTable, renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';

const require = createRequire(import.meta.url);

function getVersion(): string {
  const { version } = require('../../../package.json');
  return version as string;
}

export function registerCapabilitiesCommands(program: Command): void {
  const capabilities = program
    .command('capabilities')
    .description('Inspect the capability registry — metadata, surfaces, and backend contracts');

  capabilities
    .command('stats')
    .description('Show capability registry statistics')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const { generateManifest } = await import('../../capabilities/manifest.js');
        const manifest = generateManifest(getVersion());

        if (opts.json) {
          console.log(jsonSuccess({
            total: manifest.totalCapabilities,
            categories: manifest.categories,
            backendDistribution: manifest.backendDistribution,
            surfaceDistribution: manifest.surfaceDistribution,
          }));
        } else {
          console.log(`Capability Registry v${manifest.version}`);
          console.log(`Total capabilities: ${manifest.totalCapabilities}\n`);

          const catRows = Object.entries(manifest.categories)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cat, count]) => [cat, String(count)]);
          console.log(renderTable(['Category', 'Count'], catRows, { title: 'Categories' }));

          console.log('');
          const backendRows = Object.entries(manifest.backendDistribution)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([svc, count]) => [svc, String(count)]);
          console.log(renderTable(['Backend Service', 'Count'], backendRows, { title: 'Backend Distribution' }));

          console.log('');
          const surfaceRows = Object.entries(manifest.surfaceDistribution)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([surface, count]) => [surface, String(count)]);
          console.log(renderTable(['Surface', 'Count'], surfaceRows, { title: 'Surface Distribution' }));
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });

  capabilities
    .command('export')
    .description('Export full capability manifest')
    .option('--format <format>', 'Output format (json)', 'json')
    .action(async (opts) => {
      try {
        const { generateManifest } = await import('../../capabilities/manifest.js');
        const manifest = generateManifest(getVersion());
        console.log(JSON.stringify(manifest, null, 2));
      } catch (error) {
        handleError(error, opts.format === 'json');
      }
    });

  capabilities
    .command('list')
    .description('List capabilities with filters')
    .option('--category <category>', 'Filter by category')
    .option('--surface <surface>', 'Filter by surface (aiTool, cliCommand, slashCommand)')
    .option('--backend-type <type>', 'Filter by backend type (query, mutation, none)')
    .option('--destructive', 'Show only destructive capabilities')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      try {
        const { getAllCapabilities } = await import('../../chat/tools/registry.js');
        let caps = getAllCapabilities();

        if (opts.category) caps = caps.filter(c => c.category === opts.category);
        if (opts.surface) caps = caps.filter(c => c.surfaces.includes(opts.surface));
        if (opts.backendType) caps = caps.filter(c => c.backendType === opts.backendType);
        if (opts.destructive) caps = caps.filter(c => c.destructive);

        caps.sort((a, b) => a.name.localeCompare(b.name));

        if (caps.length === 0) {
          const msg = 'No capabilities match the given filters.';
          if (opts.json) {
            console.log(jsonSuccess([], { total: 0 }));
          } else {
            console.log(msg);
          }
          return;
        }

        if (opts.json) {
          const data = caps.map(c => ({
            name: c.name,
            displayName: c.displayName,
            category: c.category,
            backendType: c.backendType,
            backendService: c.backendService,
            destructive: c.destructive,
            surfaces: [...c.surfaces],
          }));
          console.log(jsonSuccess(data, { total: data.length }));
        } else {
          const rows = caps.map(c => [
            c.name,
            c.category,
            c.backendType,
            c.backendService,
            c.surfaces.join(', '),
            c.destructive ? 'yes' : '',
          ]);
          console.log(renderTable(
            ['Name', 'Category', 'Backend Type', 'Service', 'Surfaces', 'Destructive'],
            rows,
            { truncate: 40 },
          ));
          console.log(`\n${caps.length} capabilities.`);
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });

  capabilities
    .command('inspect <name>')
    .description('Show detailed metadata for a specific capability')
    .option('--json', 'Output as JSON')
    .action(async (name: string, opts) => {
      try {
        const { getAllCapabilities } = await import('../../chat/tools/registry.js');
        const caps = getAllCapabilities();
        const cap = caps.find(c => c.name === name) ??
          caps.find(c => c.name.toLowerCase() === name.toLowerCase());

        if (!cap) {
          const suggestions = caps
            .filter(c => c.name.toLowerCase().includes(name.toLowerCase()))
            .slice(0, 5)
            .map(c => c.name);
          const hint = suggestions.length ? `\nDid you mean: ${suggestions.join(', ')}` : '';
          throw new Error(`Capability "${name}" not found.${hint}`);
        }

        if (opts.json) {
          const { capToSummary } = await import('../../capabilities/manifest.js');
          console.log(jsonSuccess(capToSummary(cap)));
        } else {
          const pairs: Array<[string, string]> = [
            ['Name', cap.name],
            ['Display Name', cap.displayName],
            ['Category', cap.category],
            ['Description', cap.description],
            ['Backend Type', cap.backendType],
            ['Backend Service', cap.backendService],
            ['Backend Resolver', cap.backendResolver ?? '(none)'],
            ['Destructive', cap.destructive ? 'yes' : 'no'],
            ['Requires Space', cap.requiresSpace ? 'yes' : 'no'],
            ['Requires Event', cap.requiresEvent ? 'yes' : 'no'],
            ['Surfaces', cap.surfaces.join(', ')],
          ];
          if (cap.permissions?.length) pairs.push(['Permissions', cap.permissions.join(', ')]);
          if (cap.deprecated) pairs.push(['Deprecated', 'yes']);
          if (cap.experimental) pairs.push(['Experimental', 'yes']);
          if (cap.whenToUse) pairs.push(['When to Use', cap.whenToUse]);
          if (cap.tags?.length) pairs.push(['Tags', cap.tags.join(', ')]);
          console.log(renderKeyValue(pairs));

          if (cap.params.length > 0) {
            console.log('\nParameters:');
            const rows = cap.params.map(p => [
              p.name,
              typeof p.type === 'object' ? 'object' : p.type,
              p.required ? 'required' : 'optional',
              p.description,
            ]);
            console.log(renderTable(['Name', 'Type', 'Required', 'Description'], rows, { truncate: 40 }));
          } else {
            console.log('\nNo parameters.');
          }
        }
      } catch (error) {
        handleError(error, opts.json);
      }
    });

  capabilities
    .command('generate-skills')
    .description('Generate skill files from the capability registry')
    .option('--dir <directory>', 'Target directory for generated files')
    .action(async (opts) => {
      try {
        const { generateSkillFiles } = await import('../../capabilities/skill-generator.js');
        const result = generateSkillFiles(opts.dir);
        console.log(`Generated ${result.files.length} skill files in ${result.dir}`);
        for (const file of result.files) {
          console.log(`  ${file}`);
        }
      } catch (error) {
        handleError(error, false);
      }
    });
}
