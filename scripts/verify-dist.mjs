#!/usr/bin/env node

/**
 * Verifies that every .js file in dist/ has a corresponding source file in src/.
 * Detects stale artifacts that would ship in a release.
 *
 * Exit 0 = clean, Exit 1 = stale files found.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';

const root = process.cwd();
const distDir = resolve(root, 'dist');
const srcDir = resolve(root, 'src');

if (!existsSync(distDir)) {
  console.error('dist/ does not exist — run build first');
  process.exit(1);
}

function collectFiles(dir, ext) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

const distJsFiles = collectFiles(distDir, '.js');
const stale = [];

for (const distFile of distJsFiles) {
  const rel = relative(distDir, distFile).replace(/\.js$/, '');

  // Check for .ts or .tsx source
  const tsPath = resolve(srcDir, rel + '.ts');
  const tsxPath = resolve(srcDir, rel + '.tsx');

  if (!existsSync(tsPath) && !existsSync(tsxPath)) {
    stale.push('dist/' + relative(distDir, distFile));
  }
}

if (stale.length > 0) {
  console.error(`Found ${stale.length} stale dist file(s) with no source counterpart:\n`);
  for (const f of stale) {
    console.error(`  ${f}`);
  }
  console.error('\nRun "yarn clean && yarn build" to fix.');
  process.exit(1);
} else {
  console.log(`dist/ verified: ${distJsFiles.length} .js files, all have source counterparts.`);
}
