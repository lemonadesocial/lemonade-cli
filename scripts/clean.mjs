import { rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(scriptDir, '..', 'dist');

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
  console.log('cleaned dist/');
} else {
  console.log('dist/ does not exist, nothing to clean');
}
