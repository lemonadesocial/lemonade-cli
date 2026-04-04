#!/usr/bin/env node

/**
 * Verifies that every emitted file in dist/ has a corresponding source file in src/.
 * Checks .js, .d.ts, .js.map, and .d.ts.map artifacts.
 * Detects stale artifacts that would ship in a release.
 *
 * Exit 0 = clean, Exit 1 = stale files found.
 */

import { readdirSync, existsSync } from 'node:fs';
import { resolve, relative, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const distDir = resolve(root, 'dist');
const srcDir = resolve(root, 'src');

if (!existsSync(distDir)) {
  console.error('dist/ does not exist — run build first');
  process.exit(1);
}

// Emitted suffixes in order of specificity (longer suffixes first so matching works correctly).
const emittedSuffixes = ['.d.ts.map', '.d.ts', '.js.map', '.js'];

function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (emittedSuffixes.some((s) => entry.name.endsWith(s))) {
      results.push(full);
    }
  }
  return results;
}

function stripEmittedSuffix(filename) {
  for (const s of emittedSuffixes) {
    if (filename.endsWith(s)) return filename.slice(0, -s.length);
  }
  return null;
}

const distFiles = collectFiles(distDir);
const stale = [];

for (const distFile of distFiles) {
  const rel = relative(distDir, distFile);
  const stem = stripEmittedSuffix(rel);
  if (stem === null) continue;

  const tsPath = resolve(srcDir, stem + '.ts');
  const tsxPath = resolve(srcDir, stem + '.tsx');

  if (!existsSync(tsPath) && !existsSync(tsxPath)) {
    stale.push('dist/' + rel);
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
  console.log(`dist/ verified: ${distFiles.length} file(s) across .js, .d.ts, .js.map, .d.ts.map — all have source counterparts.`);
}
