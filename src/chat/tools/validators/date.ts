const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export function validateISODate(dateStr: string): string | null {
  if (!ISO_DATE_PATTERN.test(dateStr)) {
    return `Invalid date format: "${dateStr}". Use ISO 8601 format (e.g., "2025-01-15" or "2025-01-15T09:00:00Z").`;
  }
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return `Invalid date: "${dateStr}" does not resolve to a valid date.`;
  }
  return null;
}

export function validateDateRange(start: string, end?: string): string | null {
  if (!end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
  if (endDate <= startDate) {
    return `Invalid date range: end ("${end}") must be after start ("${start}").`;
  }
  return null;
}
