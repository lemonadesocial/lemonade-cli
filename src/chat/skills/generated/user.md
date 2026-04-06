<!-- Auto-generated from capability registry. Do not edit manually. -->

# User Tools

3 tools in this category.

### auth whoami (`get_me`)

Get the current authenticated user profile.

- **Backend:** graphql → `aiGetMe` (query)
- **Surfaces:** aiTool, cliCommand
- **Destructive:** no

---

### user search (`user_search`)

Search users by name or email.

- **Backend:** graphql → `searchUsers` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `query` (string, required) — Search query (name or email)

---

### user update (`user_update`)

Update your profile (name, display name, bio, tagline, timezone, username, social handles).

- **Backend:** graphql → `updateUser` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `name` (string, optional) — Full name
  - `display_name` (string, optional) — Display name
  - `description` (string, optional) — Bio/description
  - `tagline` (string, optional) — Short tagline
  - `timezone` (string, optional) — Timezone (e.g., America/New_York)
  - `username` (string, optional) — Username
  - `job_title` (string, optional) — Job title
  - `company_name` (string, optional) — Company name
  - `website` (string, optional) — Website URL
  - `handle_twitter` (string, optional) — Twitter/X handle
  - `handle_instagram` (string, optional) — Instagram handle
  - `handle_linkedin` (string, optional) — LinkedIn handle

---

## Related Tools

`get_me`, `user_search`, `user_update`
