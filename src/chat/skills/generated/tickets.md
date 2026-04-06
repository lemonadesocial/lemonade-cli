<!-- Auto-generated from capability registry. Do not edit manually. -->

# Tickets Tools

14 tools in this category.

### my tickets (`my_tickets`)

Get tickets the current user has purchased.

- **Backend:** graphql → `aiGetMyTickets` (query)
- **Surfaces:** aiTool
- **Destructive:** no

---

### tickets assign (`tickets_assign`)

Assign tickets to users by email or user ID.

- **Backend:** graphql → `assignTickets` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `assignments` (string, required) — JSON array of assignments: [{ticket, email}] or [{ticket, user}]

---

### tickets buy (`tickets_buy`)

Purchase tickets for an event. Requires attendee info for each ticket.

- **Backend:** atlas (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `ticket_type` (string, required) — Ticket type ID
  - `quantity` (number, required) — Number of tickets
  - `attendee_names` (string[], required) — Attendee names, one per ticket
  - `attendee_emails` (string[], required) — Attendee emails, one per ticket
  - `discount_code` (string, optional) — Discount code

---

### tickets cancel (`tickets_cancel`)

Cancel specific tickets for an event.

- **Backend:** graphql → `cancelTickets` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `ticket_ids` (string, required) — Comma-separated ticket IDs to cancel

---

### tickets create (`tickets_create`)

Create complimentary tickets (no payment). The ticket type determines the event. Assignments are by email.

- **Backend:** graphql → `createTickets` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `ticket_type` (string, required) — Ticket type ID
  - `assignments` (string, required) — JSON array of assignments: [{email, count}]

---

### tickets create-discount (`tickets_create_discount`)

Create a discount code for an event ticket type.

- **Backend:** graphql → `aiCreateEventTicketDiscount` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `code` (string, required) — Discount code
  - `ratio` (number, required) — Discount ratio (0.0-1.0)
  - `ticket_type_id` (string, optional) — Ticket type ID
  - `limit` (number, optional) — Usage limit

---

### tickets create-type (`tickets_create_type`)

Create a ticket type for an event. Omit price for a free ticket.

- **Backend:** graphql → `aiCreateEventTicketType` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `name` (string, required) — Ticket type name
  - `price` (number, optional) — Price in dollars (e.g. 25.00, omit for free)
  - `currency` (string, optional) — Currency code
  - `limit` (number, optional) — Max tickets available
  - `description` (string, optional) — Ticket description

---

### tickets email (`tickets_email`)

Email event tickets to specified addresses.

- **Backend:** graphql → `mailEventTicket` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `emails` (string, required) — Comma-separated email addresses
  - `payment_id` (string, optional) — Payment ID (optional, to email specific payment tickets)

---

### tickets email receipt (`tickets_email_receipt`)

Email payment receipt for a specific ticket.

- **Backend:** graphql → `mailTicketPaymentReceipt` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `ticket_id` (string, required) — Ticket ID

---

### tickets types (`tickets_list_types`)

List ticket types for an event.

- **Backend:** graphql → `aiListEventTicketTypes` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### tickets price (`tickets_price`)

Calculate ticket price with optional discount.

- **Backend:** graphql → `aiCalculateTicketPrice` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `ticket_type` (string, required) — Ticket type ID
  - `quantity` (number, optional) — Number of tickets
  - `discount_code` (string, optional) — Discount code

---

### tickets receipt (`tickets_receipt`)

Check ticket purchase receipt status.

- **Backend:** atlas (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `hold_id` (string, required) — Hold ID from purchase

---

### tickets update-type (`tickets_update_type`)

Update an existing ticket type.

- **Backend:** graphql → `aiUpdateEventTicketType` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `ticket_type_id` (string, required) — Ticket type ID
  - `name` (string, optional) — New name
  - `price` (number, optional) — New price in dollars
  - `currency` (string, optional) — New currency code
  - `limit` (number, optional) — New max tickets
  - `active` (boolean, optional) — Active status

---

### tickets upgrade (`tickets_upgrade`)

Upgrade a ticket to a different ticket type.

- **Backend:** graphql → `upgradeTicket` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `ticket_id` (string, required) — Ticket ID to upgrade
  - `to_type` (string, required) — Target ticket type ID

---

## Related Tools

`my_tickets`, `tickets_assign`, `tickets_buy`, `tickets_cancel`, `tickets_create`, `tickets_create_discount`, `tickets_create_type`, `tickets_email`, `tickets_email_receipt`, `tickets_list_types`, `tickets_price`, `tickets_receipt`, `tickets_update_type`, `tickets_upgrade`
