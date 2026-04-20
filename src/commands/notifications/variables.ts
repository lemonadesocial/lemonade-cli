/**
 * Build the category-scoped variables object for the notification commands
 * (`read --all`, `read --all --category=…`, `unread`, `unread --category=…`).
 *
 * Per PRD US-2.10 / US-3.13: when the `--category` flag is absent, the
 * variables object must OMIT the key entirely (NOT set it to `null`). The
 * server distinguishes "no category filter" from "explicit null" and the
 * wire shape must match the former.
 *
 * Commander leaves `opts.category` unset (i.e. `undefined`) when the flag is
 * not supplied; the defensive null/empty-string checks guard against sentinel
 * values from env or future Commander behaviour changes.
 */
export function buildCategoryVariables(
  category: string | undefined,
): Record<string, unknown> {
  const variables: Record<string, unknown> = {};
  if (category !== undefined && category !== null && category !== '') {
    variables.category = category;
  }
  return variables;
}
