# NitroBot Architecture

## Runtime boundaries

`src/index.js` is the composition root. It validates environment configuration,
loads command and event modules, creates the Discord client, installs shutdown
handlers, and logs in. Keep it thin; business behavior belongs in importable,
offline-testable modules.

Commands export a serializable `data` definition and an asynchronous `execute`
handler. Command names are unique. Events export `name`, `execute`, and an
optional boolean `once`. Loaders validate these contracts before the client
connects.

`handleInteraction` owns command routing and safe failure acknowledgement.
Preserve Discord's single-initial-response contract:

- Reply privately when a failure occurs before acknowledgement.
- Edit a deferred reply.
- Follow up privately after a reply already exists.
- Log response failures without leaking internal errors to the user.

## Security and reliability invariants

- Use only `GatewayIntentBits.Guilds` until a feature demonstrates the need for
  another intent.
- Keep tokens and Discord identifiers in environment variables. Errors may name
  a missing variable but must not include its value.
- Treat usernames, guild names, command options, and Discord payloads as
  untrusted input. Avoid constructing code, filesystem paths, or privileged
  requests from them.
- Do not log tokens, authorization headers, complete environment objects, or
  interaction payloads that may contain private content.
- Reduce caught errors to allowlisted diagnostic fields before logging them;
  Discord REST errors may contain callback URLs, webhook tokens, and request
  bodies.
- Use dependency injection at network and time boundaries so tests stay
  deterministic.
- Catch failures at user-facing and event-dispatch boundaries; do not silently
  discard them.
- Deploying command definitions is an explicit maintenance action, never a
  startup side effect.

## Change design

Before a cross-cutting change, identify:

1. User-visible behavior and failure behavior.
2. Module contracts and data flow affected.
3. Discord permissions, intents, or acknowledgement timing affected.
4. Configuration, secrets, network, and operational impact.
5. Unit, integration, staging, and rollback evidence required.

Record a decision in `docs/decisions/` when it introduces or replaces an
enduring dependency, module boundary, configuration contract, permission,
deployment model, or operational constraint. Copy `template.md`, assign the
next four-digit number, and include the chosen option and consequences.

## Staging and release

Offline tests and CI never receive Discord credentials. Discord-visible changes
require a separate staging application and guild. A human approves staging,
performs the smoke checklist in `docs/staging.md`, and records results in the
pull request.

There is no production deployment yet. Do not create production automation
until hosting, health checks, logging, restart behavior, rollback, and command
registration ownership are explicitly designed.
