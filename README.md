# Lemonade CLI

Manage Spaces, events, tickets, and more from the terminal. Built for developers and AI agents.

## Install

```bash
npm install -g lemonade-cli
```

Or run directly:

```bash
npx lemonade-cli --help
```

## Authentication

```bash
# Login via browser (OAuth)
lemonade auth login

# Or use an API key
lemonade auth token <your-api-key>

# Check current user
lemonade auth whoami
```

## Commands

### Spaces

```bash
lemonade space create --title "Berlin Techno"
lemonade space list
lemonade space update <id> --description "Underground events"
lemonade space connect eventbrite          # Connect Eventbrite account
lemonade space connectors                  # List connected platforms
lemonade space analytics <id>
lemonade space plan <id>                   # Show current plan and usage
lemonade space upgrade <id>                # Open subscription page
```

### Events

```bash
lemonade event create --title "Warehouse Party" --space <id>
lemonade event list
lemonade event search "techno berlin"      # Atlas federated search
lemonade event get <id>
lemonade event update <id> --description "Updated info"
lemonade event publish <id>
lemonade event cancel <id>
lemonade event analytics <id>
lemonade event guests <id>
lemonade event invite <id> --email user@example.com
lemonade event approvals <id>              # Manage join requests
lemonade event feedback <id>
lemonade event checkins <id>
```

### Tickets

```bash
lemonade tickets types <event-id>
lemonade tickets create-type <event-id> --title "Early Bird" --price 25
lemonade tickets update-type <id> --price 30
lemonade tickets price <event-id>
lemonade tickets buy <event-id> --type <type-id> --quantity 2
```

### Rewards

```bash
lemonade rewards balance
lemonade rewards history
lemonade rewards payouts
lemonade rewards referral
lemonade rewards settings
```

### Site Builder

```bash
lemonade site generate "A landing page for our techno community"
lemonade site preview
lemonade site deploy <space-id>
lemonade site templates
```

### Connectors

```bash
lemonade connectors list
lemonade connectors sync <id>
```

### Configuration

```bash
lemonade config init                       # Create ~/.lemonade/config.json
lemonade config set default_space <id>
lemonade config get default_space
```

## JSON Output

Every command supports `--json` for structured output:

```bash
lemonade event list --json
```

Returns:

```json
{
  "ok": true,
  "data": [
    { "_id": "abc123", "title": "Warehouse Party", "start": "2026-04-15T22:00:00Z" }
  ]
}
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `LEMONADE_API_KEY` | API key (skips login) |
| `LEMONADE_API_URL` | Backend URL (default: production) |
| `LEMONADE_REGISTRY_URL` | Atlas Registry URL |

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | User error (bad input, not found) |
| 2 | Authentication error |
| 3 | Network error |

## Development

```bash
git clone https://github.com/lemonadesocial/lemonade-cli.git
cd lemonade-cli
yarn install
yarn build
yarn test
yarn dev -- --help    # Run locally
```

## License

MIT
