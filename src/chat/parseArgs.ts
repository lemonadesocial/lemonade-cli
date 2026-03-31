export function parseArgs(argv: string[]): {
  provider?: string;
  model?: string;
  mode?: string;
  json: boolean;
  help: boolean;
} {
  const result = {
    provider: undefined as string | undefined,
    model: undefined as string | undefined,
    mode: undefined as string | undefined,
    json: false,
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
      case '--mode':
        result.mode = argv[++i];
        break;
      case '--json':
        result.json = true;
        break;
      case '--simple':
        // Ignored — readline mode is now the default and only mode
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}
