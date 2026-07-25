# NitroBot

NitroBot is a small, extensible Discord bot built with [discord.js](https://discord.js.org/). It uses guild-scoped slash commands, native ES modules, validated environment configuration, and Node's built-in test runner.

## Requirements

- Node.js 22.21 or newer
- npm
- A Discord application and a server where you can install it

## Discord setup

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. On the **Bot** page, create a bot and reset/copy its token.
3. On **OAuth2 > URL Generator**, select the `bot` and `applications.commands` scopes. No additional bot permissions are required by the included commands.
4. Open the generated URL and install the bot in your development server.
5. Enable Developer Mode in Discord, then copy the application ID and server ID.

Treat the bot token like a password. Never paste it into source code, logs, issues, or commits. If it is exposed, reset it immediately in the Developer Portal.

## Installation and configuration

Install the locked dependencies:

```bash
npm ci
```

Copy `.env.example` to `.env` and replace the placeholders:

```dotenv
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-application-id
DISCORD_GUILD_ID=your-development-server-id
```

`.env` files are ignored by Git. In hosted environments, inject these values through the platform's secret manager instead of creating a file. The application validates all three variables before connecting to Discord and never includes their values in validation errors.

## Running the bot

Register the slash commands in the configured server whenever their definitions change:

```bash
npm run deploy
```

Then start the bot:

```bash
npm start
```

Guild commands normally update immediately. This project intentionally does not register global commands.

## Commands

| Command | Description |
| --- | --- |
| `/help` | Privately lists the bot's available commands. |
| `/ping` | Replies with `Pong!`. |
| `/secretping` | Replies privately with `Pong!`. |
| `/server` | Shows the current server's name and member count. |
| `/user` | Shows the caller's username and server join date. |
| `/sourcecode` | Links to this repository. |

## Project structure

```text
src/
  commands/       Slash-command definitions and handlers
  events/         Discord event handlers
  client.js       Client creation and event registration
  config.js       Environment validation
  deploy.js       Guild command deployment
  errors.js       Allowlisted error diagnostics
  interactions.js Command routing and safe error responses
  loaders.js      Command and event discovery/validation
  index.js        Application bootstrap
scripts/          Executable maintenance scripts
test/             Offline unit tests
```

At startup, the bot validates configuration, discovers command and event modules, creates a minimally privileged Discord client, and registers the event handlers. When Discord emits an interaction, the interaction event routes it to the command stored under its name. Command failures produce allowlisted local diagnostics, while users receive a generic private response that does not reveal internal details.

## Adding a command

Create a `.js` file in `src/commands/` with named `data` and `execute` exports:

```js
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('hello')
	.setDescription('Says hello.');

export async function execute(interaction) {
	await interaction.reply(`Hello, ${interaction.user.username}!`);
}
```

Command names must be unique. The loader fails at startup if a module is malformed or duplicates another command. Run `npm run deploy` after adding or changing a command definition.

## Adding an event

Create a `.js` file in `src/events/` with `name` and `execute` exports. Export `once = true` for an event that should run only once:

```js
import { Events } from 'discord.js';

export const name = Events.Warn;

export function execute(message) {
	console.warn(message);
}
```

Event names must be unique in this project. Rejected event promises are caught and logged by the client wrapper.

## Development scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Load an optional `.env` file and connect to Discord. |
| `npm run deploy` | Replace guild commands with the local command definitions. |
| `npm test` | Run all unit tests without connecting to Discord. |
| `npm run test:watch` | Re-run affected tests while editing. |
| `npm run test:coverage` | Run tests with enforced production-code coverage. |
| `npm run typecheck` | Statically check JavaScript with TypeScript. |
| `npm run lint` | Check JavaScript with ESLint. |
| `npm run verify` | Run linting, type checking, tests, and coverage gates. |
| `npm run check` | Compatibility alias for `npm run verify`. |

Pull requests and pushes run the complete verification suite on the minimum
supported Node.js 22.21.0 release and the current Node.js 24 LTS release.
Ordinary CI never receives Discord credentials and cannot deploy commands.

## Quality and delivery workflow

Repository-level agent guidance lives in [`AGENTS.md`](AGENTS.md). It defines
the bot's invariants, the authority boundary for autonomous changes, required
architecture/security/QA reviews, and the evidence required before a draft
pull request can be updated.

`npm run verify` is the local and CI quality gate. It checks lint rules, strict
JavaScript types, offline behavior, and 90% global statement, branch, function,
and line coverage. Coverage is a regression floor rather than proof of correct
behavior, so source changes also receive independent QA.

GitHub additionally runs CodeQL and dependency review, while Dependabot
proposes weekly dependency and Actions updates. The stable `Quality gate` job
is the branch-protection contract above the Node version matrix.

Discord-facing changes can be exercised with a manually approved, time-bounded
staging workflow using a separate application and guild. See
[`docs/repository-settings.md`](docs/repository-settings.md) for the external
GitHub controls that must be configured and [`docs/staging.md`](docs/staging.md)
for the smoke-test checklist. There is intentionally no production deployment
workflow yet.

## Troubleshooting

- **Missing environment variable:** Check the spelling of all names in `.env`. Values already present in the shell take precedence over the file.
- **Invalid Discord ID:** Application and guild IDs are numeric Discord snowflakes, not their display names.
- **Commands are missing or stale:** Run `npm run deploy` and confirm `DISCORD_GUILD_ID` identifies the server where the bot is installed.
- **The bot is offline:** Confirm the token is current and the bot has been installed in the configured server. Reset the token if there is any chance it was exposed.
- **A command reports an internal error:** Inspect the local process logs. User-facing replies intentionally omit internal error details.
