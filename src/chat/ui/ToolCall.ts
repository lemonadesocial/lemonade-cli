const MAX_RESULT_LINES = 3;
const MAX_RESULT_CHARS = 500;

export function truncateResult(text: string): string {
  let truncated = text;
  if (truncated.length > MAX_RESULT_CHARS) {
    truncated = truncated.slice(0, MAX_RESULT_CHARS) + '...';
  }
  const lines = truncated.split('\n');
  if (lines.length > MAX_RESULT_LINES) {
    truncated = lines.slice(0, MAX_RESULT_LINES).join('\n') + '\n...';
  }
  return truncated;
}
