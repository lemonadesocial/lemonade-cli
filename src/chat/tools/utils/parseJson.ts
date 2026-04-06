export function parseJsonObject(value: string, fieldName: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(`${fieldName} must be a JSON object`);
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error(`Invalid JSON for ${fieldName}`);
    throw e;
  }
}

export function parseJsonArray(value: string, fieldName: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error(`${fieldName} must be a JSON array`);
    }
    return parsed;
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error(`Invalid JSON for ${fieldName}`);
    throw e;
  }
}
