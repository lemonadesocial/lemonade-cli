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
  const emitted = [];
  const unexpected = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = collectFiles(full);
      emitted.push(...sub.emitted);
      unexpected.push(...sub.unexpected);
    } else if (emittedSuffixes.some((s) => entry.name.endsWith(s))) {
      emitted.push(full);
    } else {
      unexpected.push(full);
    }
  }
  return { emitted, unexpected };
}

function stripEmittedSuffix(filename) {
  for (const s of emittedSuffixes) {
    if (filename.endsWith(s)) return filename.slice(0, -s.length);
  }
  return null;
}

const { emitted: distFiles, unexpected } = collectFiles(distDir);
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

let failed = false;

if (unexpected.length > 0) {
  console.error(`Found ${unexpected.length} unexpected file(s) in dist/ (not part of emitted artifact set):\n`);
  for (const f of unexpected) {
    console.error(`  dist/${relative(distDir, f)}`);
  }
  console.error('\nOnly .js, .d.ts, .js.map, and .d.ts.map files are expected.');
  console.error('Run "yarn clean && yarn build" to fix.');
  failed = true;
}

if (stale.length > 0) {
  if (failed) console.error('');
  console.error(`Found ${stale.length} stale dist file(s) with no source counterpart:\n`);
  for (const f of stale) {
    console.error(`  ${f}`);
  }
  console.error('\nRun "yarn clean && yarn build" to fix.');
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.log(`dist/ verified: ${distFiles.length} emitted file(s) — all have source counterparts, no unexpected files.`);
}
