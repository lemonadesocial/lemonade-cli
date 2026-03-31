export function parseArgs(argv: string[]): {
  provider?: string;
  model?: string;
  json: boolean;
  simple: boolean;
  help: boolean;
} {
  const result = {
    provider: undefined as string | undefined,
    model: undefined as string | undefined,
    json: false,
    simple: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--provider':
        result.provider = argv[++i];
        break;
      case '--model':
        result.model = argv[++i];
        break;
      case '--json':
        result.json = true;
        break;
      case '--simple':
        result.simple = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}
