<!-- Auto-generated from capability registry. Do not edit manually. -->

# Voting Tools

2 tools in this category.

### event vote (`event_vote`)

Cast or change a vote in an event voting session. Omit option_id to remove your vote.

- **Backend:** graphql → `castVote` (mutation)
- **Surfaces:** aiTool
- **Destructive:** yes
- **Requires:** event

**Parameters:**
  - `voting_id` (string, required) — Voting session ID
  - `option_id` (string, optional) — Option ID to vote for (omit to unvote)

---

### event votings (`event_votings`)

List voting sessions for an event.

- **Backend:** graphql → `listEventVotings` (query)
- **Surfaces:** aiTool
- **Destructive:** no
- **Requires:** event

**Parameters:**
  - `event_id` (string, required) — Event ID
  - `voting_ids` (string, optional) — Comma-separated voting IDs to filter
  - `hidden` (boolean, optional) — Include hidden votings

---

## Related Tools

`event_vote`, `event_votings`
