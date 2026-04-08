export function validateCurrency(code: string): string | null {
  try {
    new Intl.DisplayNames(['en'], { type: 'currency' }).of(code.toUpperCase());
    return null;
  } catch {
    return `Invalid currency code: "${code}". Use ISO 4217 format (e.g., "USD", "EUR").`;
  }
}
