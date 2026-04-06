<!-- Auto-generated from capability registry. Do not edit manually. -->

# Payment Tools

16 tools in this category.

### event payment detail (`event_payment_detail`)

Get details of a specific payment.

- **Backend:** graphql → `getEventPayment` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `payment_id` (string, required) — Payment ID

---

### event payment statistics (`event_payment_statistics`)

Get detailed payment statistics by provider (Stripe vs crypto) with network breakdowns. For simple revenue totals, use event_payment_stats.

- **Backend:** graphql → `getEventPaymentStatistics` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event payment stats (`event_payment_stats`)

Get payment statistics for an event.

- **Backend:** graphql → `aiGetEventPaymentStats` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event payment summary (`event_payment_summary`)

Get detailed payment breakdown for an event by currency.

- **Backend:** graphql → `getEventPaymentSummary` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID

---

### event payments list (`event_payments_list`)

List payments for an event with optional filters.

- **Backend:** graphql → `listEventPayments` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `search` (string, optional) — Search by buyer name or email
  - `provider` (string, optional) — Filter by payment provider
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset

---

### payment accounts list (`list_payment_accounts`)

List payment accounts configured for receiving payments (Stripe, crypto wallets).

- **Backend:** graphql → `listNewPaymentAccounts` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `type` (string, optional) — Filter by type
  - `provider` (string, optional) — Filter by provider
  - `limit` (number, optional) — Max results
  - `skip` (number, optional) — Pagination offset
  - `account_ids` (string, optional) — Comma-separated account IDs to filter

---

### payment account create escrow (`payment_account_create_escrow`)

Create an escrow payment account. Funds are held in escrow until event completion.

- **Backend:** graphql → `createNewPaymentAccount` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `network` (string, required) — Chain ID
  - `address` (string, required) — Escrow contract address (0x...)
  - `currencies` (string, required) — Comma-separated token symbols
  - `minimum_deposit_percent` (number, required) — Minimum deposit percentage (0-100)
  - `title` (string, optional) — Display name

---

### payment account create relay (`payment_account_create_relay`)

Create a relay/payment-splitter payment account. Address is auto-set from chain config.

- **Backend:** graphql → `createNewPaymentAccount` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `network` (string, required) — Chain ID
  - `payment_splitter_contract` (string, required) — Payment splitter contract address (0x...)
  - `currencies` (string, required) — Comma-separated token symbols
  - `title` (string, optional) — Display name

---

### payment account create safe (`payment_account_create_safe`)

Create a Safe multisig wallet payment account. Omit address to auto-deploy a new Safe (1 free per user, gasless via Gelato). Provide address to import an existing Safe.

- **Backend:** graphql → `createNewPaymentAccount` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `network` (string, required) — Chain ID
  - `owners` (string, required) — Comma-separated owner wallet addresses
  - `threshold` (number, required) — Number of required confirmations
  - `currencies` (string, required) — Comma-separated token symbols
  - `address` (string, optional) — Existing Safe address to import (omit to deploy new)
  - `title` (string, optional) — Display name

---

### payment account create stake (`payment_account_create_stake`)

Create a stake payment account. Attendees stake tokens. Address is auto-set from chain config.

- **Backend:** graphql → `createNewPaymentAccount` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `network` (string, required) — Chain ID
  - `config_id` (string, required) — Stake configuration ID
  - `currencies` (string, required) — Comma-separated token symbols
  - `requirement_checkin_before` (string, optional) — Check-in deadline (ISO 8601)
  - `title` (string, optional) — Display name

---

### payment account create stripe (`payment_account_create_stripe`)

Create a Stripe payment account for fiat payments. Requires Stripe Connect to be completed first (use space_stripe_connect). No account_info needed — currencies are auto-configured.

- **Backend:** graphql → `createNewPaymentAccount` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `title` (string, optional) — Display name

---

### payment account create wallet (`payment_account_create_wallet`)

Create an Ethereum wallet payment account for receiving crypto payments. Use list_chains first to find available networks and tokens.

- **Backend:** graphql → `createNewPaymentAccount` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `network` (string, required) — Chain ID (e.g. '8453' for Base, '42161' for Arbitrum). Use list_chains to see available networks.
  - `address` (string, required) — Ethereum wallet address (0x...)
  - `currencies` (string, required) — Comma-separated token symbols available on this chain (e.g. 'USDC,ETH')
  - `title` (string, optional) — Display name (defaults to address)

---

### payment account update (`payment_account_update`)

Update a payment account title or configuration.

- **Backend:** graphql → `updateNewPaymentAccount` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

**Parameters:**
  - `account_id` (string, required) — Payment account ID
  - `account_info` (string, required) — Updated account configuration as JSON object (required by backend — send current config if only changing title)
  - `title` (string, optional) — New display name

---

### safe free limit (`safe_free_limit`)

Check Safe wallet deployment eligibility for a network. Each user gets 1 free gasless Safe deployment.

- **Backend:** graphql → `getSafeFreeLimit` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `network` (string, required) — Chain ID (numeric string, e.g. '8453' for Base). Use list_chains to find available networks.

---

### stripe capabilities (`stripe_capabilities`)

View Stripe payment method capabilities (card, Apple Pay, Google Pay).

- **Backend:** graphql → `getStripeConnectedAccountCapability` (query)
- **Surfaces:** aiTool
- **Destructive:** no

---

### stripe disconnect (`stripe_disconnect`)

Disconnect Stripe payment account. This is irreversible.

- **Backend:** graphql → `disconnectStripeAccount` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes

---

## Related Tools

`event_payment_detail`, `event_payment_statistics`, `event_payment_stats`, `event_payment_summary`, `event_payments_list`, `list_payment_accounts`, `payment_account_create_escrow`, `payment_account_create_relay`, `payment_account_create_safe`, `payment_account_create_stake`, `payment_account_create_stripe`, `payment_account_create_wallet`, `payment_account_update`, `safe_free_limit`, `stripe_capabilities`, `stripe_disconnect`
