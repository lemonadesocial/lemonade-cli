<!-- Auto-generated from capability registry. Do not edit manually. -->

# Tempo Tools

4 tools in this category.

### tempo services (`tempo_services`)

Discover MPP-registered services that accept Tempo payments.

- **Backend:** local (none)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `search` (string, optional) — Search query

---

### tempo setup payouts (`tempo_setup_payouts`)

Configure your Tempo wallet as the reward payout destination. Auto-detects wallet address.

- **Backend:** atlas → `atlasUpdatePayoutSettings` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, optional) — Space ID

---

### tempo status (`tempo_status`)

Check Tempo wallet status — installation, address, balances, key readiness.

- **Backend:** local (none)
- **Surfaces:** aiTool, slashCommand
- **Destructive:** no

---

### tempo transfer (`tempo_transfer`)

Send USDC to an address via Tempo wallet.

- **Backend:** local (none)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `amount` (string, required) — Amount (e.g., "10.00")
  - `token` (string, required) — Token symbol (e.g., USDC)
  - `to` (string, required) — Recipient 0x address

---

## Related Tools

`tempo_services`, `tempo_setup_payouts`, `tempo_status`, `tempo_transfer`
