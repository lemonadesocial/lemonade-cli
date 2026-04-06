<!-- Auto-generated from capability registry. Do not edit manually. -->

# Subscription Tools

5 tools in this category.

### subscription cancel (`subscription_cancel`)

Cancel an AI credit subscription for a community.

- **Backend:** graphql → `cancelSubscription` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** space

**Parameters:**
  - `stand_id` (string, required) — Community/stand ObjectId

---

### subscription features (`subscription_features`)

List all subscription features and their tier-level configuration.

- **Backend:** graphql → `listSubscriptionFeatureConfigs` (query)
- **Surfaces:** aiTool
- **Destructive:** no

---

### subscription plans (`subscription_plans`)

List available subscription plans with pricing and AI credit allocations.

- **Backend:** graphql → `listSubscriptionItems` (query)
- **Surfaces:** aiTool
- **Destructive:** no

---

### subscription status (`subscription_status`)

Get current subscription status for a community, including subscription record, detail items, and pending payment info.

- **Backend:** graphql → `getSpaceSubscription` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `space_id` (string, required) — Space ObjectId

---

### subscription upgrade (`subscription_upgrade`)

Purchase or upgrade a community subscription tier. Returns a Stripe checkout URL.

- **Backend:** graphql → `purchaseSubscription` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `stand_id` (string, required) — Community/stand ObjectId
  - `tier` (string, required) — Subscription tier
  - `annual` (boolean, optional) — Annual billing if true

---

## Related Tools

`subscription_cancel`, `subscription_features`, `subscription_plans`, `subscription_status`, `subscription_upgrade`
