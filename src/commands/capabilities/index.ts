import { Command } from 'commander';
import { jsonSuccess } from '../../output/json.js';
import { renderTable, renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { getPackageVersion } from '../../config/version.js';
import { isValidSurface } from '../../capabilities/filter.js';

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
        const manifest = generateManifest(getPackageVersion());

        if (opts.json) {
          console.log(jsonSuccess({
            total: manifest.totalCapabilities,
            categories: manifest.categories,
            backendServiceDistribution: manifest.backendServiceDistribution,
            backendTypeDistribution: manifest.backendTypeDistribution,
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
          const serviceRows = Object.entries(manifest.backendServiceDistribution)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([svc, count]) => [svc, String(count)]);
          console.log(renderTable(['Backend Service', 'Count'], serviceRows, { title: 'Backend Service Distribution' }));

          console.log('');
          const typeRows = Object.entries(manifest.backendTypeDistribution)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([t, count]) => [t, String(count)]);
          console.log(renderTable(['Backend Type', 'Count'], typeRows, { title: 'Backend Type Distribution' }));

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
    .description('Export full capability manifest as JSON')
    .action(async () => {
      try {
        const { generateManifest } = await import('../../capabilities/manifest.js');
        const manifest = generateManifest(getPackageVersion());
        console.log(JSON.stringify(manifest, null, 2));
      } catch (error) {
        handleError(error, true);
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
        if (opts.surface && !isValidSurface(opts.surface)) {
          throw new Error(`Invalid surface "${opts.surface}". Valid surfaces: aiTool, cliCommand, slashCommand`);
        }

        const { getAllCapabilities } = await import('../../chat/tools/registry.js');
        const { filterCapabilities } = await import('../../capabilities/filter.js');
        const caps = filterCapabilities(getAllCapabilities(), {
          category: opts.category,
          surface: opts.surface,
          backendType: opts.backendType,
          destructive: opts.destructive,
        });

        if (caps.length === 0) {
          const filters: string[] = [];
          if (opts.category) filters.push(`category "${opts.category}"`);
          if (opts.surface) filters.push(`surface "${opts.surface}"`);
          if (opts.backendType) filters.push(`backend-type "${opts.backendType}"`);
          if (opts.destructive) filters.push('destructive only');
          const filterDesc = filters.length > 0 ? filters.join(', ') : 'the given filters';
          const msg = `No capabilities found matching ${filterDesc}.`;
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
        const { findCapability, getSuggestions } = await import('../../capabilities/filter.js');
        const caps = getAllCapabilities();
        const cap = findCapability(caps, name);

        if (!cap) {
          const suggestions = getSuggestions(caps, name);
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
    .command('drift')
    .description('Detect drift between CLI capability resolvers and backend schema')
    .option('--json', 'Output full drift report as JSON')
    .option('--broken', 'Show only broken mappings (CLI resolver not in backend)')
    .option('--gaps', 'Show only coverage gaps (backend resolver with no CLI tool)')
    .option('--schema <path>', 'Path to backend-resolvers.json (default: schema/backend-resolvers.json)')
    .action(async (opts) => {
      try {
        const { checkDrift } = await import('../../capabilities/drift.js');
        const report = checkDrift(opts.schema);

        if (opts.json) {
          console.log(JSON.stringify(report, null, 2));
          return;
        }

        if (opts.broken) {
          if (report.broken.length === 0) {
            console.log('No broken mappings found.');
          } else {
            console.log(renderTable(
              ['Resolver', 'Tool', 'Reason'],
              report.broken.map(b => [b.resolver, b.tool, b.reason]),
              { title: `Broken Mappings (${report.broken.length})`, truncate: 60 },
            ));
          }
          return;
        }

        if (opts.gaps) {
          if (report.gaps.length === 0) {
            console.log('No coverage gaps found.');
          } else {
            console.log(renderTable(
              ['Resolver', 'Type'],
              report.gaps.map(g => [g.resolver, g.type]),
              { title: `Coverage Gaps (${report.gaps.length})` },
            ));
          }
          return;
        }

        // Summary report
        console.log(`Backend Drift Report (schema: ${report.schemaDate})\n`);
        console.log(`Backend resolvers: ${report.totalBackendResolvers}`);
        console.log(`CLI resolvers:     ${report.totalCliResolvers}`);
        console.log(`Coverage:          ${report.coveragePercent}%`);
        console.log(`Covered:           ${report.covered.length}`);
        console.log(`Broken:            ${report.broken.length}`);
        console.log(`Gaps:              ${report.gaps.length}\n`);

        if (report.broken.length > 0) {
          console.log(renderTable(
            ['Resolver', 'Tool', 'Reason'],
            report.broken.map(b => [b.resolver, b.tool, b.reason]),
            { title: `Broken Mappings (${report.broken.length})`, truncate: 60 },
          ));
          console.log('');
        }

        if (report.covered.length > 0) {
          console.log(renderTable(
            ['Resolver', 'Tool', 'Type'],
            report.covered.map(c => [c.resolver, c.tool, c.type]),
            { title: `Covered (${report.covered.length})` },
          ));
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
