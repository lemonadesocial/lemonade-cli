<!-- Auto-generated from capability registry. Do not edit manually. -->

# System Tools

10 tools in this category.

### available models (`available_models`)

List AI models available for the current subscription tier.

- **Backend:** graphql → `getAvailableModels` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `space_id` (string, optional) — Space ObjectId (optional for tier filtering)

---

### CLI version (`cli_version`)

Check the current CLI version and whether an update is available from npm.

- **Backend:** local (none)
- **Surfaces:** aiTool
- **Destructive:** no

---

### credits balance (`credits_balance`)

Check AI credit balance for a community, including subscription tier, purchased credits, and renewal date.

- **Backend:** graphql → `getStandCredits` (query)
- **Surfaces:** aiTool, slashCommand
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `stand_id` (string, required) — Community/stand ObjectId

---

### credits buy (`credits_buy`)

Purchase a credit top-up package. Returns a Stripe checkout URL.

- **Backend:** graphql → `purchaseCredits` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `stand_id` (string, required) — Community/stand ObjectId
  - `package` (string, required) — Credit package

---

### credits usage (`credits_usage`)

Get usage analytics for a community over a date range: daily usage, breakdown by model, top users, and totals.

- **Backend:** graphql → `getUsageAnalytics` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `stand_id` (string, required) — Community/stand ObjectId
  - `start_date` (string, required) — Start date ISO 8601
  - `end_date` (string, required) — End date ISO 8601

---

### cubejs token (`cubejs_token`)

Generate a CubeJS analytics token for external BI dashboard access.

- **Backend:** graphql → `generateCubejsToken` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `events` (string, optional) — Comma-separated event IDs to scope the token
  - `site_id` (string, optional) — Site ID to scope the token
  - `user_id` (string, optional) — User ID to scope the token

---

### backend version (`get_backend_version`)

Get the backend API version.

- **Backend:** graphql → `aiGetBackendVersion` (query)
- **Surfaces:** aiTool, cliCommand
- **Destructive:** no

---

### list chains (`list_chains`)

List supported blockchain networks.

- **Backend:** graphql → `aiListChains` (query)
- **Surfaces:** aiTool, cliCommand
- **Destructive:** no

---

### set preferred model (`set_preferred_model`)

Set the current user preferred AI model.

- **Backend:** graphql → `setPreferredModel` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `model_id` (string, required) — Model ID string (from available_models)

---

### set space default model (`set_space_default_model`)

Set a community default AI model.

- **Backend:** graphql → `setSpaceDefaultModel` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ObjectId
  - `model_id` (string, required) — Model ID string

---

## Related Tools

`available_models`, `cli_version`, `credits_balance`, `credits_buy`, `credits_usage`, `cubejs_token`, `get_backend_version`, `list_chains`, `set_preferred_model`, `set_space_default_model`
