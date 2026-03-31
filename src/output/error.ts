import { GraphQLError } from '../api/graphql.js';
import { AtlasError } from '../api/atlas.js';
import { jsonError } from './json.js';

export enum ExitCode {
  SUCCESS = 0,
  USER_ERROR = 1,
  AUTH_ERROR = 2,
  NETWORK_ERROR = 3,
}

export function handleError(error: unknown, json: boolean): never {
  let code = 'UNKNOWN';
  let message = 'An unexpected error occurred';
  let exitCode = ExitCode.USER_ERROR;

  if (error instanceof GraphQLError) {
    code = error.code || 'GRAPHQL_ERROR';
    message = error.message;
    exitCode = error.statusCode === 401 || error.statusCode === 403
      ? ExitCode.AUTH_ERROR
      : ExitCode.USER_ERROR;
  } else if (error instanceof AtlasError) {
    code = `ATLAS_${error.statusCode}`;
    message = error.message;
    exitCode = error.statusCode === 401 ? ExitCode.AUTH_ERROR : ExitCode.USER_ERROR;
  } else if (error instanceof TypeError && (error as NodeJS.ErrnoException).code === 'UND_ERR_CONNECT_TIMEOUT') {
    code = 'NETWORK_TIMEOUT';
    message = 'Request timed out';
    exitCode = ExitCode.NETWORK_ERROR;
  } else if (error instanceof Error) {
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.name === 'AbortError') {
      code = 'NETWORK_ERROR';
      message = `Cannot reach server: ${error.message}`;
      exitCode = ExitCode.NETWORK_ERROR;
    } else {
      message = error.message;
    }
  }

  if (json) {
    process.stderr.write(jsonError(code, message) + '\n');
  } else {
    process.stderr.write(`Error: ${message}\n`);
  }

  process.exit(exitCode);
}
