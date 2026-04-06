<!-- Auto-generated from capability registry. Do not edit manually. -->

# Rewards Tools

5 tools in this category.

### rewards balance (`rewards_balance`)

View reward balance for a space.

- **Backend:** atlas → `atlasRewardSummary` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID

---

### rewards history (`rewards_history`)

View reward transaction history for a space.

- **Backend:** atlas → `atlasRewardHistory` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ID
  - `limit` (number, optional) — Max results
  - `offset` (number, optional) — Skip results

---

### rewards payouts (`rewards_payouts`)

View payout history.

- **Backend:** atlas → `atlasPayoutHistory` (query)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `limit` (number, optional) — Max results
  - `offset` (number, optional) — Skip results

---

### rewards referral (`rewards_referral`)

Generate, apply, or view referral codes.

- **Backend:** atlas → `atlasGenerateReferralCode` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `action` (string, required) — Action: generate, apply, or view
  - `code` (string, optional) — Referral code (for apply action)

---

### rewards settings (`rewards_settings`)

View or update payout settings.

- **Backend:** atlas → `atlasUpdatePayoutSettings` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no

**Parameters:**
  - `wallet_address` (string, optional) — Payout wallet address (0x...)
  - `wallet_chain` (string, optional) — Payout chain
  - `preferred_method` (string, optional) — Preferred method: stripe|crypto

---

## Related Tools

`rewards_balance`, `rewards_history`, `rewards_payouts`, `rewards_referral`, `rewards_settings`
