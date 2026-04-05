export const VALID_FLAGS = ['--provider', '--model', '--mode', '--json', '--help'] as const;

export function parseArgs(argv: string[]): {
  provider?: string;
  model?: string;
  mode?: string;
  json: boolean;
  help: boolean;
  simpleDeprecated: boolean;
  unknownFlags: string[];
} {
  const result = {
    provider: undefined as string | undefined,
    model: undefined as string | undefined,
    mode: undefined as string | undefined,
    json: false,
    help: false,
    simpleDeprecated: false,
    unknownFlags: [] as string[],
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--provider':
        result.provider = argv[++i];
        break;
      case '--model':
        result.model = argv[++i];
        break;
      case '--mode':
        result.mode = argv[++i];
        break;
      case '--json':
        result.json = true;
        break;
      case '--simple':
        result.simpleDeprecated = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
      default:
        if (argv[i].startsWith('-')) {
          result.unknownFlags.push(argv[i]);
        }
        break;
    }
  }

  return result;
}
