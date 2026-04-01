import { execSync, spawnSync, spawn as spawnChild } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Tempo installs to ~/.tempo/bin/tempo — may not be in current process PATH
function getTempoBin(): string | null {
  // Check PATH first
  try {
    execSync('which tempo', { encoding: 'utf-8', stdio: 'pipe', timeout: 3000 });
    return 'tempo';
  } catch {
    // Check default install location
    const defaultPath = join(homedir(), '.tempo', 'bin', 'tempo');
    if (existsSync(defaultPath)) return defaultPath;
    return null;
  }
}

export function isTempoInstalled(): boolean {
  return getTempoBin() !== null;
}

export async function installTempo(): Promise<boolean> {
  try {
    // Use pipe instead of inherit to avoid breaking Ink's terminal
    execSync('curl -fsSL https://tempo.xyz/install | bash', {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 120000,
    });
    // Verify installation
    return isTempoInstalled();
  } catch {
    return false;
  }
}

export function tempoExec(args: string): string {
  const bin = getTempoBin();
  if (!bin) throw new Error('Tempo CLI not installed. Use /tempo install.');
  try {
    return execSync(`${bin} ${args}`, { encoding: 'utf-8', stdio: 'pipe', timeout: 15000 }).trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Tempo CLI error: ${msg}`);
  }
}

export function tempoSpawn(args: string[]): { code: number | null; stdout: string; stderr: string } {
  const bin = getTempoBin();
  if (!bin) return { code: 1, stdout: '', stderr: 'Tempo CLI not installed' };
  const result = spawnSync(bin, args, { encoding: 'utf-8', timeout: 30000 });
  return { code: result.status, stdout: result.stdout?.trim() || '', stderr: result.stderr?.trim() || '' };
}

// Interactive login — streams output so user can see the confirmation code
export function tempoLogin(onOutput: (line: string) => void): Promise<{ success: boolean; output: string }> {
  const bin = getTempoBin();
  if (!bin) return Promise.resolve({ success: false, output: 'Tempo CLI not installed.' });

  return new Promise((resolve) => {
    let allOutput = '';
    const child = spawnChild(bin, ['wallet', 'login'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      allOutput += text;
      // Send each line to the callback so the UI can display it
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed) onOutput(trimmed);
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      allOutput += text;
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed) onOutput(trimmed);
      }
    });

    child.on('close', (code) => {
      resolve({ success: code === 0, output: allOutput.trim() });
    });

    child.on('error', (err) => {
      resolve({ success: false, output: err.message });
    });

    // 5 minute timeout — multi-step auth may need more time
    setTimeout(() => {
      child.kill();
      resolve({ success: false, output: 'Login timed out (5 minutes). Try /tempo login again.' });
    }, 300000);
  });
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
    try {
      const data = JSON.parse(output);
      return { installed: true, loggedIn: true, ...data };
    } catch {
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
