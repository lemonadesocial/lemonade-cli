import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomBytes } from 'crypto';

export class DiagReporter {
  private logPath: string;
  private sessionId: string;
  private enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
    this.sessionId = randomBytes(4).toString('hex');
    const dir = join(homedir(), '.lemonade');
    if (enabled && !existsSync(dir)) mkdirSync(dir, { recursive: true });
    this.logPath = join(dir, 'diagnostics.log');
  }

  log(monitor: string, level: 'INFO' | 'WARN' | 'ANOMALY' | 'ERROR', msg: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;
    const entry = { ts: Date.now(), sid: this.sessionId, mon: monitor, lvl: level, msg, ...(data ? { data } : {}) };
    try {
      appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
    } catch { /* ignore write failures */ }
  }

  anomaly(monitor: string, msg: string, data?: Record<string, unknown>): void {
    this.log(monitor, 'ANOMALY', msg, data);
  }

  assertion(condition: boolean, monitor: string, msg: string, data?: Record<string, unknown>): void {
    if (!condition) {
      this.log(monitor, 'ERROR', `ASSERTION FAILED: ${msg}`, data);
    }
  }

  get isEnabled(): boolean { return this.enabled; }
}
