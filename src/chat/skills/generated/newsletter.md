<!-- Auto-generated from capability registry. Do not edit manually. -->

# Newsletter Tools

7 tools in this category.

### newsletter create (`newsletter_create`)

Create a newsletter for a space.

- **Backend:** graphql → `createSpaceNewsletter` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `subject` (string, required) — Email subject (HTML supported)
  - `body` (string, required) — Email body (HTML supported)
  - `cc` (string, optional) — CC email addresses (comma-separated)
  - `scheduled_at` (string, optional) — Schedule send time (ISO 8601)
  - `recipient_types` (string, optional) — Comma-separated recipient types: assigned, attending, registration, invited, space_tagged_people
  - `draft` (boolean, optional) — Save as draft (server default applies if omitted)

---

### newsletter delete (`newsletter_delete`)

Delete a newsletter.

- **Backend:** graphql → `deleteSpaceNewsletter` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `newsletter_id` (string, required) — Newsletter ID

---

### newsletter get (`newsletter_get`)

Get details of a specific newsletter.

- **Backend:** graphql → `getSpaceNewsletter` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `newsletter_id` (string, required) — Newsletter ID

---

### newsletter list (`newsletter_list`)

List newsletters for a space (drafts, scheduled, or sent).

- **Backend:** graphql → `listSpaceNewsletters` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `draft` (boolean, optional) — Show only drafts
  - `sent` (boolean, optional) — Show only sent
  - `scheduled` (boolean, optional) — Show only scheduled

---

### newsletter stats (`newsletter_stats`)

Get newsletter statistics for a space (sent, delivered, opened).

- **Backend:** graphql → `getSpaceNewsletterStatistics` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID

---

### newsletter test send (`newsletter_test_send`)

Send a test newsletter to specified email addresses.

- **Backend:** graphql → `sendSpaceNewsletterTestEmails` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `test_recipients` (string, required) — Comma-separated test email addresses
  - `newsletter_id` (string, optional) — Existing newsletter ID to test
  - `subject` (string, optional) — Subject (if not using existing newsletter)
  - `body` (string, optional) — Body (if not using existing newsletter)

---

### newsletter update (`newsletter_update`)

Update an existing newsletter.

- **Backend:** graphql → `updateSpaceNewsletter` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `newsletter_id` (string, required) — Newsletter ID
  - `subject` (string, optional) — New email subject (HTML supported)
  - `body` (string, optional) — New email body (HTML supported)
  - `cc` (string, optional) — CC addresses (comma-separated)
  - `scheduled_at` (string, optional) — Schedule send time (ISO 8601)
  - `recipient_types` (string, optional) — Comma-separated recipient types
  - `draft` (boolean, optional) — Save as draft
  - `disabled` (boolean, optional) — Disable newsletter

---

## Related Tools

`newsletter_create`, `newsletter_delete`, `newsletter_get`, `newsletter_list`, `newsletter_stats`, `newsletter_test_send`, `newsletter_update`
