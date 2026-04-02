// TerminalProtocolController — single owner for terminal protocol state
// (bracketed paste enable/disable + raw stdin listener for paste detection).
//
// Previously owned by MultilineInput's useEffect. Moving it here
// ensures one clear owner at the terminal/runtime boundary.

export type PasteStateListener = (isPasting: boolean) => void;

export class TerminalProtocolController {
  private listeners = new Set<PasteStateListener>();
  private rawHandler: ((data: Buffer) => void) | null = null;
  private enabled = false;

  /** Enable bracketed paste mode and start listening for paste sequences. */
  enable(): void {
    if (this.enabled) return;
    this.enabled = true;

    process.stdout.write('\x1b[?2004h');

    this.rawHandler = (data: Buffer): void => {
      const str = data.toString();
      if (str.includes('\x1b[200~')) this.notify(true);
      if (str.includes('\x1b[201~')) this.notify(false);
    };

    process.stdin.prependListener('data', this.rawHandler);
  }

  /** Disable bracketed paste mode and remove the raw listener. */
  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;

    if (this.rawHandler) {
      process.stdin.removeListener('data', this.rawHandler);
      this.rawHandler = null;
    }

    process.stdout.write('\x1b[?2004l');
  }

  /** Subscribe to paste-state changes. Returns an unsubscribe function. */
  onPasteStateChange(listener: PasteStateListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify(isPasting: boolean): void {
    for (const listener of this.listeners) {
      listener(isPasting);
    }
  }
}

// Module-level singleton — created once, owned by terminal.ts lifecycle.
let _instance: TerminalProtocolController | null = null;

export function initTerminalProtocol(): TerminalProtocolController {
  if (!_instance) _instance = new TerminalProtocolController();
  return _instance;
}

export function getTerminalProtocol(): TerminalProtocolController {
  if (!_instance) _instance = new TerminalProtocolController();
  return _instance;
}
