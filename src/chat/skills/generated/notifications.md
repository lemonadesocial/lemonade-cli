<!-- Auto-generated from capability registry. Do not edit manually. -->

# Notifications Tools

2 tools in this category.

### notifications list (`notifications_list`)

Get recent notifications.

- **Backend:** graphql → `aiGetNotifications` (query)
- **Surfaces:** aiTool
- **Destructive:** no

---

### notifications read (`notifications_read`)

Mark notifications as read.

- **Backend:** graphql → `aiReadNotifications` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `notification_ids` (string[], required) — Notification IDs to mark as read

---

## Related Tools

`notifications_list`, `notifications_read`
