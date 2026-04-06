import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

function findPackageJson(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (dir !== dirname(dir)) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  // Fallback: use createRequire resolution
  const require = createRequire(import.meta.url);
  return require.resolve('../../package.json');
}

let _version: string | null = null;

export function getPackageVersion(): string {
  if (!_version) {
    const pkg = JSON.parse(readFileSync(findPackageJson(), 'utf-8'));
    _version = pkg.version as string;
  }
  return _version;
}
