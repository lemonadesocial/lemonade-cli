import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let _version: string | null = null;

export function getPackageVersion(): string {
  if (!_version) {
    const { version } = require('../../package.json');
    _version = version as string;
  }
  return _version;
}
