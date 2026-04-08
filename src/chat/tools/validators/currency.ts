const VALID_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW',
  'BRL', 'MXN', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK',
  'HUF', 'TRY', 'ZAR', 'THB', 'TWD', 'ILS', 'AED', 'SAR', 'QAR', 'KWD',
  'BHD', 'OMR', 'EGP', 'NGN', 'KES', 'GHS', 'TZS', 'UGX', 'RWF', 'ETB',
  'MAD', 'XOF', 'XAF',
]);

export function validateCurrency(code: string): string | null {
  if (VALID_CURRENCIES.has(code.toUpperCase())) return null;
  return `Invalid currency code: "${code}". Use ISO 4217 format (e.g., "USD", "EUR").`;
}
