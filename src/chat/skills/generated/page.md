<!-- Auto-generated from capability registry. Do not edit manually. -->

# Page Tools

15 tools in this category.

### page archive (`page_archive`)

Archive a page configuration.

- **Backend:** graphql → `archivePageConfig` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `page_id` (string, required) — PageConfig ObjectId

---

### page config create (`page_config_create`)

Create a page configuration with full control over sections and theme. For AI-assisted creation, use site_create_page.

- **Backend:** graphql → `createPageConfig` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `owner_type` (string, required) — Owner type
  - `owner_id` (string, required) — Event or space ID
  - `name` (string, optional) — Page name
  - `template_id` (string, optional) — Template ID to base config on
  - `theme` (string, optional) — Theme config as JSON
  - `sections` (string, optional) — Sections as JSON array

---

### page config get (`page_config_get`)

Get a page configuration by ID.

- **Backend:** graphql → `getPageConfig` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `config_id` (string, required) — Page config ID

---

### page config published (`page_config_published`)

Get the currently published page configuration for an event or space.

- **Backend:** graphql → `getPublishedConfig` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `owner_type` (string, required) — Owner type
  - `owner_id` (string, required) — Event or space ID

---

### page config update (`page_config_update`)

Update a page configuration (name, description, theme, sections).

- **Backend:** graphql → `updatePageConfig` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `config_id` (string, required) — Page config ID
  - `name` (string, optional) — Page name
  - `description` (string, optional) — Page description
  - `theme` (string, optional) — Theme config as JSON
  - `sections` (string, optional) — Sections as JSON array

---

### page list versions (`page_list_versions`)

List saved versions of a page configuration.

- **Backend:** graphql → `listConfigVersions` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `config_id` (string, required) — PageConfig ObjectId

---

### page preview link (`page_preview_link`)

Generate a preview link for a draft page configuration.

- **Backend:** graphql → `generatePreviewLink` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `config_id` (string, required) — Page config ID
  - `password` (string, optional) — Optional password protection
  - `expires_in_hours` (number, optional) — Link expiry in hours

---

### page restore version (`page_restore_version`)

Restore a page configuration to a previous version.

- **Backend:** graphql → `restoreConfigVersion` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `config_id` (string, required) — PageConfig ObjectId
  - `version` (number, required) — Version number to restore

---

### page save version (`page_save_version`)

Save a named version snapshot of a page configuration.

- **Backend:** graphql → `saveConfigVersion` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `config_id` (string, required) — PageConfig ObjectId
  - `name` (string, optional) — Version name

---

### page section catalog (`page_section_catalog`)

Get the catalog of available section types for page building.

- **Backend:** graphql → `getSectionCatalog` (query)
- **Surfaces:** aiTool
- **Destructive:** no

---

### site create-page (`site_create_page`)

Create a page configuration using AI assistance. For manual control over sections and theme, use page_config_create.

- **Backend:** graphql → `aiCreatePageConfig` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `owner_id` (string, required) — Event or space ID
  - `owner_type` (string, required) — Owner type
  - `name` (string, optional) — Page name
  - `theme` (string, optional) — Theme config as JSON
  - `sections` (string, optional) — Sections as JSON array
  - `template_id` (string, optional) — Template ID to base config on

---

### site deploy (`site_deploy`)

Publish a page.

- **Backend:** graphql → `publishPageConfig` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `page_id` (string, required) — Page ID

---

### site generate (`site_generate`)

AI-generate a page from a text description.

- **Backend:** graphql → `aiGeneratePageFromDescription` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `owner_id` (string, required) — Owner ID (event or space)
  - `owner_type` (string, required) — Owner type: event|space
  - `description` (string, required) — Page description
  - `style` (string, optional) — Style hints

---

### site templates (`site_templates`)

List available page section templates with AI suggestions.

- **Backend:** graphql → `aiSuggestSections` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `owner_type` (string, required) — Owner type
  - `owner_id` (string, required) — Event or space ID
  - `context` (string, optional) — Context for AI suggestions

---

### site update-section (`site_update_section`)

Update a section in a page configuration.

- **Backend:** graphql → `aiUpdatePageConfigSection` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `page_id` (string, required) — Page config ID
  - `section_id` (string, required) — Section ID
  - `updates` (string, required) — Section updates as JSON object

---

## Related Tools

`page_archive`, `page_config_create`, `page_config_get`, `page_config_published`, `page_config_update`, `page_list_versions`, `page_preview_link`, `page_restore_version`, `page_save_version`, `page_section_catalog`, `site_create_page`, `site_deploy`, `site_generate`, `site_templates`, `site_update_section`
