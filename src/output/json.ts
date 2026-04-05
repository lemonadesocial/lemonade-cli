export interface JsonEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    upgrade_url?: string;
    upgrade_command?: string;
  };
  cursor?: string | null;
  total?: number;
}

export function jsonSuccess<T>(data: T, pagination?: { cursor?: string | null; total?: number }, options?: { compact?: boolean }): string {
  const envelope: JsonEnvelope<T> = { ok: true, data };
  if (pagination) {
    envelope.cursor = pagination.cursor;
    envelope.total = pagination.total;
  }
  return options?.compact ? JSON.stringify(envelope) : JSON.stringify(envelope, null, 2);
}

export function jsonError(code: string, message: string, extra?: { upgrade_url?: string; upgrade_command?: string }, options?: { compact?: boolean }): string {
  const envelope: JsonEnvelope<never> = {
    ok: false,
    error: { code, message, ...extra },
  };
  return options?.compact ? JSON.stringify(envelope) : JSON.stringify(envelope, null, 2);
}
