<!-- Auto-generated from capability registry. Do not edit manually. -->

# Connector Tools

9 tools in this category.

### connector config options (`connector_config_options`)

Fetch dropdown options for connector configuration (e.g., list of Airtable bases).

- **Backend:** graphql → `fetchConnectionConfigOptions` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `connection_id` (string, required) — Connection ID
  - `option_key` (string, required) — Config option key to fetch (e.g., baseId, tableId)

---

### connector configure (`connector_configure`)

Configure a connected integration (set organization, calendar, sync schedule, etc.).

- **Backend:** graphql → `configureConnection` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `connection_id` (string, required) — Connection ID
  - `config` (string, required) — Configuration as JSON string
  - `sync_schedule` (string, optional) — Cron schedule (e.g., "0 * * * *" for hourly)

---

### connector connect (`connector_connect`)

Initiate connecting a new integration to a space. Returns OAuth URL for OAuth connectors or requiresApiKey for API key connectors.

- **Backend:** graphql → `connectPlatform` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `connector_type` (string, required) — Connector type (e.g., google-sheets, luma, eventbrite, airtable, meetup, dice)

---

### connector disconnect (`connector_disconnect`)

Disconnect an integration from a space. This revokes access and removes all credentials.

- **Backend:** graphql → `disconnectPlatform` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `connection_id` (string, required) — Connection ID

---

### connector logs (`connector_logs`)

View sync activity logs for a connection.

- **Backend:** graphql → `connectionLogs` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `connection_id` (string, required) — Connection ID
  - `limit` (number, optional) — Max results

---

### connector slot info (`connector_slot_info`)

Check how many connector slots a space has used vs allowed.

- **Backend:** graphql → `connectorSlotInfo` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID

---

### connector submit API key (`connector_submit_api_key`)

Submit an API key for an API-key-based connector (Luma, Dice, etc.).

- **Backend:** graphql → `submitApiKey` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `connection_id` (string, required) — Connection ID from connector_connect
  - `api_key` (string, required) — API key

---

### connectors list (`connectors_list`)

List available platform integrations.

- **Backend:** graphql → `availableConnectors` (query)
- **Surfaces:** aiTool, slashCommand
- **Destructive:** no

---

### connectors sync (`connectors_sync`)

Trigger a connector sync.

- **Backend:** graphql → `executeConnectorAction` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `connection_id` (string, required) — Connection ID
  - `action` (string, optional) — Action to execute

---

## Related Tools

`connector_config_options`, `connector_configure`, `connector_connect`, `connector_disconnect`, `connector_logs`, `connector_slot_info`, `connector_submit_api_key`, `connectors_list`, `connectors_sync`
