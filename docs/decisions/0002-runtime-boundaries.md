# ADR-0002: Runtime boundaries and offline verification

- Status: accepted
- Date: 2026-07-25

## Context

The legacy bot combines configuration, Discord client creation, module loading,
event routing, command deployment, and process startup in side-effectful root
files. Configuration comes from JSON, failures can expose raw Discord errors,
and the existing test command does not exercise behavior.

The runtime modernization needs importable boundaries that remain testable
without Discord credentials while preserving the existing command surface,
guild scope, and least-privilege gateway access.

## Decision

- Use native ES modules on Node.js 22.21 or newer.
- Keep production modules under `src/`, maintenance composition roots under
  `scripts/`, and offline behavior tests under `test/`.
- Keep `src/index.js` as a thin process composition root that validates
  configuration, loads modules, creates the client, installs shutdown handlers,
  and logs in.
- Read `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `DISCORD_GUILD_ID` from the
  environment and validate all three before creating a client or REST request.
- Request only the `Guilds` gateway intent and disable automatic parsing of
  user-controlled mention syntax.
- Keep command deployment explicit, injected at the REST boundary, and scoped
  to `applicationGuildCommands`.
- Validate loaded command and event module contracts and reject duplicate
  names before login.
- Centralize acknowledgement-aware interaction failure responses and keep them
  generic and private.
- Reduce caught errors to fixed diagnostic types plus numeric error code and
  HTTP status fields. Do not log raw messages, URLs, headers, request bodies, or
  thrown values because Discord REST errors can contain interaction tokens and
  private response content.
- Keep JavaScript and use strict TypeScript `checkJs` analysis rather than
  migrating source files to TypeScript.
- Strengthen `npm run verify` to run ESLint, type analysis, offline tests, and
  coverage.
- Enforce 90% global statement, branch, function, and line coverage across
  `src/**/*.js`.
- Exclude `src/index.js` and `scripts/deploy-commands.js` from coverage because
  they are side-effectful composition roots; test their imported components
  through injected boundaries instead.

## Alternatives

- Keeping the legacy root layout was rejected because startup, networking, and
  behavior could not be isolated for offline verification.
- Migrating the implementation to TypeScript was rejected as unnecessary scope
  when `checkJs` provides static analysis for the existing JavaScript.
- Logging complete error objects or messages was rejected because Discord REST
  errors may retain callback URLs, webhook tokens, headers, and request bodies.
- Using global commands was rejected because the product intentionally uses
  immediate, guild-scoped command registration.
- Raising coverage to 100% was rejected because default network factories in
  composition boundaries are intentionally replaced in offline tests. Coverage
  is a regression floor, not proof of behavior.

## Consequences

Command and event modules now have explicit validated contracts, startup fails
before network access on invalid configuration, and tests can exercise command,
client, deployment, loading, event, and interaction behavior without Discord
credentials.

Operators receive less textual detail from caught error logs in exchange for
preventing credential and private-content exposure. Numeric Discord error codes
and HTTP statuses remain available for diagnosis.

Development adds ESLint flat configuration, TypeScript analysis, `c8`, and
their locked transitive dependencies. CI time and maintenance increase, and
Discord-visible behavior still requires protected staging against a dedicated
application and guild.
