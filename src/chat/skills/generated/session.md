<!-- Auto-generated from capability registry. Do not edit manually. -->

# Session Tools

4 tools in this category.

### event session reservation summary (`event_session_reservation_summary`)

Get reservation count summary per session (and optionally per ticket type).

- **Backend:** graphql → `getEventSessionReservationSummary` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `session_id` (string, optional) — Filter by specific session

---

### event session reservations (`event_session_reservations`)

List session reservations for an event.

- **Backend:** graphql → `getEventSessionReservations` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event session reserve (`event_session_reserve`)

Reserve a spot in an event session for the current user.

- **Backend:** graphql → `createEventSessionReservation` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `session_id` (string, required) — Session ID

---

### event session unreserve (`event_session_unreserve`)

Cancel a session reservation for the current user.

- **Backend:** graphql → `deleteEventSessionReservation` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `session_id` (string, required) — Session ID

---

## Related Tools

`event_session_reservation_summary`, `event_session_reservations`, `event_session_reserve`, `event_session_unreserve`
