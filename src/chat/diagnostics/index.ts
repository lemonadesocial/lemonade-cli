import { DiagReporter } from './reporter.js';
import { InputMonitor } from './inputMonitor.js';

// Stub monitors for when diagnostics are disabled (zero overhead)
const NOOP_INPUT: InputMonitor = {
  onKeypress() {},
  onStateChange() {},
  onValueSync() {},
  onOnChange() {},
  onOnSubmit() {},
  assertCursorBounds() {},
  assertBackspaceResult() {},
  assertInsertResult() {},
  assertSelectionValid(_anchor: number, _cursor: number, _textLen: number) {},
} as unknown as InputMonitor;

class CLIDiagnostics {
  readonly input: InputMonitor;
  readonly reporter: DiagReporter;

  private constructor(reporter: DiagReporter, input: InputMonitor) {
    this.reporter = reporter;
    this.input = input;
  }

  static init(debugEnv?: string): CLIDiagnostics {
    const enabled = !!debugEnv && debugEnv !== '0' && debugEnv !== 'false';
    // Granular: LEMONADE_DEBUG=input,engine
    const monitors = enabled ? (debugEnv === '1' ? ['all'] : debugEnv!.split(',')) : [];
    const inputEnabled = monitors.includes('all') || monitors.includes('input');
    const reporter = new DiagReporter(inputEnabled);
    const input = inputEnabled ? new InputMonitor(reporter) : NOOP_INPUT;
    return new CLIDiagnostics(reporter, input);
  }
}

// Global singleton — initialized lazily
let _instance: CLIDiagnostics | null = null;

export function initDiagnostics(debugEnv?: string): CLIDiagnostics {
  _instance = CLIDiagnostics.init(debugEnv);
  return _instance;
}

export function getDiag(): CLIDiagnostics {
  if (!_instance) _instance = CLIDiagnostics.init(undefined); // disabled by default
  return _instance;
}

export { DiagReporter } from './reporter.js';
export { InputMonitor } from './inputMonitor.js';
