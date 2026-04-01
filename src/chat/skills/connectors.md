# Connectors

Connectors integrate external platforms with Lemonade spaces.

## Available Connectors
connectors_list -- show all available connectors (Google Sheets, Airtable, Eventbrite, Luma, Meetup, Dice, etc.)
connector_slot_info -- check available connector slots for a space (tier-based limits).

## Connected Integrations
space_connectors -- list connected integrations for a space with status and last sync time.

## Connecting a New Integration
connector_connect -- initiate connection. For OAuth connectors (Google Sheets, Airtable, Eventbrite, Meetup): returns an authorization URL the user must visit in their browser. For API key connectors (Luma, Dice): returns requiresApiKey=true, then use connector_submit_api_key.
connector_submit_api_key -- submit API key for API-based connectors.

## Configuration
connector_configure -- set connection config (organization ID, calendar ID, base/table, sync schedule).
connector_config_options -- fetch dynamic dropdown options for config fields (e.g., list of Airtable bases).

## Running Actions
connectors_sync -- execute a connector action (sync-events, export-guests, import-guests, sync-attendees, etc.). Pass connection_id and action name.
connector_logs -- view sync activity history with status, records processed, and errors.

## Disconnecting
connector_disconnect -- disconnect and revoke access. Destructive — requires confirmation.

## Common Workflows
- Connect Luma: connector_connect → connector_submit_api_key → connector_configure (calendarApiId) → connectors_sync sync-events
- Connect Eventbrite: connector_connect → (user visits OAuth URL) → connectors_sync sync-events
- Export guests to Google Sheets: connector_connect → (OAuth) → connectors_sync export-guests
- Import from Airtable: connector_connect → (OAuth) → connector_configure (baseId, tableId) → connectors_sync import-guests
