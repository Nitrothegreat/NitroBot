# ADR-0005: Validate complete loader contracts before network startup

- Status: accepted
- Date: 2026-07-25

## Context

NitroBot loads command and event modules before creating or connecting its
Discord client. The loaders previously checked only a subset of the fields
consumed later by routing, help output, event registration, and deployment.
A malformed command could therefore pass startup validation and fail only when
help rendered it or a maintainer attempted command deployment.

## Decision

- Require command modules to export a non-null object `data` and a function
  `execute`.
- Require non-empty `data.name` and `data.description` strings.
- Invoke `data.toJSON()` during loading. It must complete synchronously and
  return a non-array object whose name and description exactly match the
  runtime fields.
- Accept only chat-input command definitions. The serialized `type` may be
  omitted or equal Discord's chat-input command type.
- Keep Discord's builder validation responsible for the complete application
  command schema rather than duplicating every API constraint in NitroBot.
- Require serialization to be deterministic and side-effect-free. Deployment
  continues to serialize definitions again when constructing its request.
- Require event modules to export a non-empty string `name`, a function
  `execute`, and, when present, a boolean `once`.
- Do not require handlers to be declared asynchronous and do not invoke them
  during loading.
- Convert locally detected contract and serialization failures to the existing
  sanitized operational error for the offending module file.

## Alternatives

- Deferring serialization until deployment was rejected because the runtime
  and help command also rely on definition fields and startup should reject
  malformed local modules before connecting.
- Caching serialized payloads was rejected because it would broaden the command
  and deployment contracts without a current need.
- Reimplementing Discord's entire command schema was rejected because it would
  duplicate version-specific validation already owned by discord.js.
- Restricting event names to the current discord.js event constants was
  rejected because compatible EventEmitter extensions may use other names.

## Consequences

Malformed local modules fail before client creation, login, or REST client
construction. Custom command definitions must provide stable synchronous
serialization, while existing `SlashCommandBuilder` definitions remain
compatible. This changes no gateway intents, permissions, guild scope,
interaction acknowledgement behavior, dependencies, or network operations.
