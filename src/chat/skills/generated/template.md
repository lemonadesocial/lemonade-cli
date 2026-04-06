<!-- Auto-generated from capability registry. Do not edit manually. -->

# Template Tools

2 tools in this category.

### template clone to config (`template_clone_to_config`)

Clone a template to create a new page configuration for an event or space.

- **Backend:** graphql → `cloneTemplateToConfig` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `template_id` (string, required) — Template ObjectId
  - `owner_type` (string, required) — Owner type
  - `owner_id` (string, required) — Event or space ObjectId

---

### template list (`template_list`)

List available page templates with optional filters.

- **Backend:** graphql → `listTemplates` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `category` (string, optional) — Filter by category
  - `target` (string, optional) — Filter by target (event, space, universal)
  - `search` (string, optional) — Search text
  - `featured` (boolean, optional) — Filter featured only
  - `tier_max` (string, optional) — Max subscription tier
  - `creator_id` (string, optional) — Filter by creator
  - `limit` (number, optional) — Pagination limit
  - `skip` (number, optional) — Pagination offset

---

## Related Tools

`template_clone_to_config`, `template_list`
