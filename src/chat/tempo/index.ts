import { execSync, spawnSync } from 'child_process';

export function isTempoInstalled(): boolean {
  try {
    execSync('tempo --version', { encoding: 'utf-8', stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function installTempo(): Promise<boolean> {
  try {
    execSync('curl -fsSL https://tempo.xyz/install | bash', { stdio: 'inherit', timeout: 60000 });
    return true;
  } catch {
    return false;
  }
}

export function tempoExec(args: string): string {
  try {
    return execSync(`tempo ${args}`, { encoding: 'utf-8', stdio: 'pipe', timeout: 15000 }).trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Tempo CLI error: ${msg}`);
  }
}

export function tempoSpawn(args: string[]): { code: number | null; stdout: string; stderr: string } {
  const result = spawnSync('tempo', args, { encoding: 'utf-8', timeout: 30000 });
  return { code: result.status, stdout: result.stdout?.trim() || '', stderr: result.stderr?.trim() || '' };
}

export interface TempoWalletInfo {
  address?: string;
  ready?: boolean;
  balances?: Record<string, string>;
  installed: boolean;
  loggedIn: boolean;
}

export function getWalletInfo(): TempoWalletInfo {
  if (!isTempoInstalled()) {
    return { installed: false, loggedIn: false };
  }
  try {
    const output = tempoExec('wallet whoami -t');
    // Try to parse as JSON (machine-readable output)
    try {
      const data = JSON.parse(output);
      return { installed: true, loggedIn: true, ...data };
    } catch {
      // Parse text output
      const addressMatch = output.match(/address[:\s]+(\S+)/i);
      const readyMatch = output.match(/ready[:\s]+(true|false)/i);
      return {
        installed: true,
        loggedIn: !!addressMatch,
        address: addressMatch?.[1],
        ready: readyMatch?.[1] === 'true',
      };
    }
  } catch {
    return { installed: true, loggedIn: false };
  }
}
