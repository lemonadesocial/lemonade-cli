/**
 * Shared formatting utilities used across commands.
 */

/**
 * Format a millisecond duration into a short human-readable relative time string.
 * E.g. 45000 -> "45s", 120000 -> "2m", 7200000 -> "2h", 172800000 -> "2d"
 */
export function formatRelativeTime(ms: number): string {
  const abs = Math.abs(ms);
  if (abs < 60_000) return `${Math.round(abs / 1000)}s`;
  if (abs < 3_600_000) return `${Math.round(abs / 60_000)}m`;
  if (abs < 86_400_000) return `${Math.round(abs / 3_600_000)}h`;
  return `${Math.round(abs / 86_400_000)}d`;
}
