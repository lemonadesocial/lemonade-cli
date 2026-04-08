# Lemonade CLI

[![npm version](https://img.shields.io/npm/v/@lemonade-social/cli)](https://www.npmjs.com/package/@lemonade-social/cli)
[![build](https://img.shields.io/github/actions/workflow/status/lemonadesocial/lemonade-cli/ci.yml?branch=main)](https://github.com/lemonadesocial/lemonade-cli/actions)
[![license](https://img.shields.io/github/license/lemonadesocial/lemonade-cli)](./LICENSE)

The most powerful events and community management toolkit for AI agents. 223 tools for [Lemonade](https://lemonade.social) -- create events, sell tickets, manage communities, run analytics, and more. Works natively with Claude Code, Claude Desktop, or any MCP-compatible client.

---

## Who is this for?

- **Claude Desktop and Claude Code users** who want to manage events and communities with natural language -- no code required
- **AI agents** that need structured tools for event lifecycle management
- **Developers and vibe coders** building on the Lemonade platform who need programmatic access
- **Event and community managers** automating event operations with AI

---

## Quick start

```bash
npm install -g @lemonade-social/cli
lemonade auth login
```

### Use with Claude Code or Claude Desktop

Add to your MCP config:

```json
{
  "mcpServers": {
    "lemonade": {
      "command": "lemonade",
      "args": ["mcp"]
    }
  }
}
```

That's it. Claude now has access to every Lemonade tool. Try:

```
> Create a paid event called "Warehouse Party" next Saturday in Berlin
>   with $25 early bird tickets, a 20% launch discount, and publish it
```

One message. Four tools chained automatically: `event_create` -> `tickets_create_type` -> `tickets_create_discount` -> `event_publish`.

```
> Give me a full health check on my Warehouse Party event
```

Guest stats, ticket sales, page views, and feedback pulled in parallel.

### Use from the terminal

```bash
lemonade event create --title "Warehouse Party" --start "2026-05-01T22:00:00Z"
lemonade event list --json
lemonade space stripe-connect
```

### Use as an AI terminal

```bash
make-lemonade
```

Interactive AI chat for natural language event management. Supports Anthropic and OpenAI.

---

## What's inside

223 tools across every part of the event lifecycle:

| Category | Tools | What you can do |
|----------|------:|-----------------|
| Events | 73 | Create, publish, update, cancel, clone, search. Full lifecycle from draft to post-event. |
| Spaces | 36 | Community hubs with members, roles, analytics, Stripe payouts, and platform connections. |
| Pages | 17 | AI-powered page builder. Generate landing pages, manage sections, version history. |
| Payments | 16 | Stripe connect, wallet setup, payment accounts, escrow, relay, and stake configurations. |
| Tickets | 14 | Ticket types, pricing, discounts, purchases, assignments, upgrades, and email receipts. |
| Connectors | 9 | Sync with Eventbrite, Luma, and other platforms. Import and export event data. |
| Newsletters | 8 | Create, send, and track email campaigns to your community. |
| Subscriptions | 6 | Plan management, feature access, upgrades, and billing. |
| Rewards | 6 | Balance, history, payouts, referrals, and reward settings. |
| Sessions | 5 | Event session scheduling, reservations, and capacity management. |
| Workflows | 3 | Multi-step recipes: paid event setup, community launch, event health check. |
| + 30 more | | File uploads, notifications, templates, themes, voting, launchpad, user management. |

---

## MCP server

```bash
lemonade mcp
```

Starts a stdio [Model Context Protocol](https://modelcontextprotocol.io) server exposing all 223 tools.

**Smart loading.** 62 core tools load immediately. 161 additional tools are available on demand via the `discover_tools` meta-tool. This keeps the active tool count well under provider limits while giving you access to everything.

**Built-in safety.** Destructive operations require confirmation. Mutations support `--dry-run` to preview changes before executing. Client-side validation catches bad timezones, currencies, and dates before they hit the API.

**Works with any MCP client:**
- Claude Desktop -- manage events and communities without writing a line of code
- Claude Code (CLI, desktop app, VS Code, JetBrains)
- Any MCP-compatible AI agent or IDE

---

## Workflows

Multi-step operations that chain tools automatically:

**Create a paid event**
`event_create` -> `tickets_create_type` -> `event_publish`

**Launch a community**
`space_create` -> `event_create`

**Event health check**
`event_guest_stats` + `event_ticket_sold_insight` + `event_view_insight` (runs in parallel)

Workflows are registered as AI tools. Ask Claude to "set up a paid event" and it selects the right workflow.

---

## Dry-run mode

Preview any mutation without executing it:

```bash
lemonade event create --title "Test" --start "2026-06-01" --dry-run
```

Returns the full payload that would be sent to the API. Works on all mutation commands and in MCP mode.

---

## Interactive AI mode

```bash
make-lemonade
```

Standalone AI terminal for managing your Lemonade account with natural language.

```
> create a techno event in Berlin next Saturday at 10pm
> add a 25 dollar early bird ticket
> publish it
> switch to my Berlin Techno space
> how are ticket sales for my warehouse party?
```

**Options:**

```bash
make-lemonade --provider openai          # Use OpenAI (default: Anthropic)
make-lemonade --model gpt-4o            # Override model
echo "list my events" | make-lemonade    # Batch mode via stdin
make-lemonade --json                     # JSON output (batch mode)
```

---

## CLI reference

Every command supports `--json` for structured output and `--dry-run` for mutation preview.

| Command | Description |
|---------|-------------|
| `lemonade mcp` | Start MCP server for Claude Desktop, Claude Code, and AI agents |
| `lemonade auth login` | Authenticate via browser |
| `lemonade auth whoami` | Check current identity |
| `lemonade event create` | Create a new event |
| `lemonade event list` | List your events |
| `lemonade event publish <id>` | Publish a draft event |
| `lemonade event guests <id>` | View guest list |
| `lemonade event analytics <id>` | Event performance dashboard |
| `lemonade space create` | Create a community space |
| `lemonade space list` | List your spaces |
| `lemonade space stripe-connect` | Connect Stripe for payouts |
| `lemonade tickets create-type` | Add a ticket type to an event |
| `lemonade tickets types <event-id>` | List ticket types |
| `lemonade site generate` | AI-generate a landing page |
| `lemonade connectors list` | List connected platforms |
| `lemonade config set` | Configure defaults |

Run `lemonade --help` for the full command list.

---

## Authentication

```bash
# Browser login (recommended)
lemonade auth login

# API key (scripts and CI)
lemonade auth token <your-api-key>

# Environment variable (CI/CD)
export LEMONADE_API_KEY=your-api-key
```

---

## Configuration

```bash
lemonade config init                     # Create config file
lemonade config set default_space <id>   # Set default space
lemonade config get default_space
```

## Environment variables

| Variable | Purpose |
|---|---|
| `LEMONADE_API_KEY` | API key (skips browser login) |
| `LEMONADE_API_URL` | Backend URL (default: production) |
| `ANTHROPIC_API_KEY` | For `make-lemonade` AI mode |
| `OPENAI_API_KEY` | For `make-lemonade` AI mode |
| `MAKE_LEMONADE_PROVIDER` | AI provider: `anthropic` or `openai` |
| `MAKE_LEMONADE_MODEL` | Model override (e.g. `claude-sonnet-4-6`, `gpt-4o`) |

---

## Contributing

```bash
git clone https://github.com/lemonadesocial/lemonade-cli.git
cd lemonade-cli
yarn install
yarn build
npm link
yarn test
```

See [CHANGELOG.md](./CHANGELOG.md) for recent changes.

---

## Links

- [Lemonade Platform](https://lemonade.social)
- [npm package](https://www.npmjs.com/package/@lemonade-social/cli)
- [Changelog](./CHANGELOG.md)
- [License](./LICENSE) (MIT)
