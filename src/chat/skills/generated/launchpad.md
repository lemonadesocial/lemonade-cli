<!-- Auto-generated from capability registry. Do not edit manually. -->

# Launchpad Tools

3 tools in this category.

### launchpad add-coin (`launchpad_add_coin`)

Add a new launchpad coin.

- **Backend:** graphql → `aiAddLaunchpadCoin` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `name` (string, required) — Coin name
  - `symbol` (string, required) — Coin symbol
  - `description` (string, optional) — Coin description

---

### launchpad list-coins (`launchpad_list_coins`)

List launchpad coins.

- **Backend:** graphql → `aiListLaunchpadCoins` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

---

### launchpad update-coin (`launchpad_update_coin`)

Update a launchpad coin.

- **Backend:** graphql → `aiUpdateLaunchpadCoin` (mutation)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** space

**Parameters:**
  - `coin_id` (string, required) — Coin ID
  - `name` (string, optional) — New name
  - `description` (string, optional) — New description

---

## Related Tools

`launchpad_add_coin`, `launchpad_list_coins`, `launchpad_update_coin`
