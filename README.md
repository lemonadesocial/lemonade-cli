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

### Use the AI terminal

```bash
make-lemonade
```

A standalone AI terminal for managing events and communities with natural language. No MCP setup needed -- just run the command and start talking.

Three ways to power it:

| Mode | Setup | Best for |
|------|-------|----------|
| **Lemonade Credits** | No API key needed -- uses your Lemonade subscription | Getting started instantly |
| **Anthropic** | `export ANTHROPIC_API_KEY=sk-ant-...` | Claude users with their own key |
| **OpenAI** | `export OPENAI_API_KEY=sk-...` | GPT users with their own key |

On first launch, `make-lemonade` walks you through setup. If you have a Lemonade subscription with AI credits, you can skip the API key step entirely.

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
| Connectors | 9 | Google Sheets, Airtable, Eventbrite, Luma, Meetup, Dice. Real-time sync, import/export. |
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

## Connectors

Extend Lemonade with real-time integrations to the tools you already use.

**Supported platforms:**

| Platform | Type | What you can do |
|----------|------|-----------------|
| Google Sheets | OAuth | Export guest lists, sync attendees, real-time event data feeds |
| Airtable | OAuth | Sync guests to bases, import attendee data, build custom views |
| Eventbrite | OAuth | Import events, sync ticket sales, migrate attendees |
| Luma | API key | Sync events and calendars, import guest data |
| Meetup | OAuth | Import events and RSVPs |
| Dice | API key | Sync event lineups and ticket data |

**What this enables:**

- **Real-time guest list sync** -- connect Google Sheets or Airtable and every new registration appears automatically. Build custom dashboards, mail merge lists, or check-in sheets without manual exports.
- **Content calendars** -- sync event schedules to Airtable or Notion-connected sheets. Plan community activations, social posts, and marketing campaigns around your event timeline.
- **Cross-platform migration** -- import your existing Eventbrite or Luma events into Lemonade with one command. Bring your attendee history with you.
- **Custom API workflows** -- use the connector tools programmatically to build automated pipelines. New event created? Auto-export the guest list. Ticket sold? Update the spreadsheet.

**Example: sync guests to Google Sheets**

```
> connect Google Sheets to my Berlin Techno space
> sync the guest list from my Warehouse Party to the connected sheet
```

The CLI handles OAuth, configuration, and sync execution. Ask Claude to set it up and it walks through each step.

---

## Dry-run mode

Preview any mutation without executing it:

```bash
lemonade event create --title "Test" --start "2026-06-01" --dry-run
```

Returns the full payload that would be sent to the API. Works on all mutation commands and in MCP mode.

---

## make-lemonade AI terminal

A full-featured AI terminal for event and community management. No MCP config, no IDE -- just natural language in your terminal.

### Getting started

```bash
# Install and authenticate
npm install -g @lemonade-social/cli
lemonade auth login

# Launch
make-lemonade
```

On first launch, `make-lemonade` detects your setup automatically:
- **Have a Lemonade subscription?** Use AI credits -- no API key needed
- **Have an Anthropic or OpenAI key?** Set it as an environment variable and go
- **Neither?** The onboarding wizard walks you through both options

### What it looks like

```
> create a techno event in Berlin next Saturday at 10pm

  Creating event...
  Event created: "Techno Night" (ID: abc123)
  Start: Saturday, April 12 at 10:00 PM CEST
  Status: Draft

> add a 25 dollar early bird ticket

  Creating ticket type...
  Ticket type created: "Early Bird" -- $25.00
  Event: Techno Night

> publish it

  Publishing event...
  Event published: Techno Night
  Link: https://lemonade.social/e/techno-night

> how are ticket sales?

  Ticket Sales: Techno Night
  Early Bird -- $25.00 -- 12 sold / 100 total -- $300.00 revenue
  Total revenue: $300.00
```

### Plan mode

Say "help me create an event" or "walk me through setting up tickets" and `make-lemonade` enters plan mode -- a step-by-step wizard that collects every detail interactively:

```
> help me create an event

  Let's set up your event step by step.

  Which space? (select)
  1. Berlin Techno
  2. Wellness Community
  > 1

  Event title?
  > Warehouse Party Vol. 3

  Start date and time?
  > next saturday at 10pm

  Location?
  > Warehouse 23, Berlin

  ...
```

Plan mode works for event creation, ticket setup, page building, and any tool with complex parameters. You can also trigger it by calling a tool with no arguments -- the system detects missing required fields and activates the wizard automatically.

### AI providers

```bash
# Lemonade Credits (no API key needed)
make-lemonade --mode credits

# Anthropic (default when key is set)
export ANTHROPIC_API_KEY=sk-ant-...
make-lemonade

# OpenAI
export OPENAI_API_KEY=sk-...
make-lemonade --provider openai

# Override model
make-lemonade --model gpt-4o
make-lemonade --model claude-sonnet-4-6

# Batch mode (stdin)
echo "list my events" | make-lemonade --json
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
| `ANTHROPIC_API_KEY` | Anthropic API key for `make-lemonade` |
| `OPENAI_API_KEY` | OpenAI API key for `make-lemonade` |
| `MAKE_LEMONADE_PROVIDER` | AI provider: `anthropic` or `openai` |
| `MAKE_LEMONADE_MODEL` | Model override (e.g. `claude-sonnet-4-6`, `gpt-4o`) |

No API key? Use `make-lemonade --mode credits` to run on Lemonade's built-in AI with your subscription credits.

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
