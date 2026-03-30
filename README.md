# Lemonade CLI

Manage events, communities, tickets, and more from the terminal. Built for developers and AI agents.

## Quickstart

```bash
# 1. Install
npm install -g @lemonade-social/cli

# 2. Authenticate
lemonade auth login              # Opens browser for OAuth

# 3. Verify
lemonade auth whoami             # Should show your name and email
```

That's it. You can now run any `lemonade` command.

### Try the AI terminal (optional)

`make-lemonade` is an interactive AI chat that manages your Lemonade account using natural language.

```bash
# Set your AI provider key (pick one)
export ANTHROPIC_API_KEY=sk-ant-...
# or
export OPENAI_API_KEY=sk-...

# Launch
make-lemonade
```

If you skip the export step, `make-lemonade` will walk you through setting up an API key on first launch.

### Local development (contributors)

If you're working on the CLI itself instead of using it:

```bash
git clone https://github.com/lemonadesocial/lemonade-cli.git
cd lemonade-cli
yarn install
yarn build
npm link                         # Makes `lemonade` and `make-lemonade` available globally
yarn test                        # Run tests
```

## Interactive AI Mode

```bash
make-lemonade
```

Chat with an AI assistant that can create events, manage tickets, switch spaces, and more -- all in natural language.

```bash
# Examples of what you can say:
> create a techno event in Berlin next Saturday at 10pm
> add a 25 dollar early bird ticket
> publish it
> switch to my Berlin Techno space
> how are ticket sales for my warehouse party?
```

**Options:**

```bash
make-lemonade --provider openai          # Use OpenAI instead of Anthropic (default)
make-lemonade --model gpt-4o            # Override the model
echo "list my events" | make-lemonade    # Batch mode via stdin
make-lemonade --json                     # JSON output (batch mode)
make-lemonade --help                     # Full options
```

## CLI Commands

### Spaces

```bash
lemonade space create --title "Berlin Techno"
lemonade space list
lemonade space update <id> --description "Underground events"
lemonade space connect <platform>        # Connect a platform (e.g. eventbrite)
lemonade space connectors <id>           # List connected platforms
lemonade space analytics <id>
lemonade space plan <id>                 # Show current plan and usage
lemonade space upgrade <id>              # Open subscription page
lemonade space stripe-connect            # Connect Stripe for payouts
lemonade space stripe-status             # Check Stripe connection status
```

### Events

```bash
lemonade event create --title "Warehouse Party" --space <id>
lemonade event list
lemonade event search "techno berlin"    # Atlas federated search
lemonade event get <id>
lemonade event update <id> --description "Updated info"
lemonade event publish <id>
lemonade event cancel <id>
lemonade event analytics <id>
lemonade event guests <id>
lemonade event invite <id> --email user@example.com
lemonade event approvals <id>            # Manage join requests
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
lemonade config init                     # Create ~/.lemonade/config.json
lemonade config set default_space <id>   # Set default space for all commands
lemonade config get default_space
```

## Authentication

Three ways to authenticate:

```bash
# Option 1: Browser login (recommended)
lemonade auth login

# Option 2: API key (for scripts and CI)
lemonade auth token <your-api-key>

# Option 3: Environment variable (for CI/CD)
export LEMONADE_API_KEY=your-api-key
```

Check your auth status:

```bash
lemonade auth whoami
```

## JSON Output

Every command supports `--json` for structured output, useful for scripting:

```bash
lemonade event list --json
```

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
| `LEMONADE_API_KEY` | API key for Lemonade (skips browser login) |
| `LEMONADE_API_URL` | Backend URL (default: production) |
| `LEMONADE_REGISTRY_URL` | Atlas Registry URL |
| `ANTHROPIC_API_KEY` | Anthropic API key (for make-lemonade) |
| `OPENAI_API_KEY` | OpenAI API key (for make-lemonade) |
| `MAKE_LEMONADE_PROVIDER` | AI provider: `anthropic` (default) or `openai` |
| `MAKE_LEMONADE_MODEL` | Model override (e.g. `claude-sonnet-4-6`, `gpt-4o`) |

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | User error (bad input, not found) |
| 2 | Authentication error |
| 3 | Network error |

## License

MIT
