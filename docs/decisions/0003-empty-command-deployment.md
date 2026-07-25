# ADR-0003: Reject empty command deployment

- Status: accepted
- Date: 2026-07-25

## Context

Discord's guild command registration endpoint replaces the complete registered
command set. Sending an empty array therefore clears every guild command. If
local command discovery unexpectedly returns no modules, the ordinary
deployment entry point must not turn that local failure into a destructive
external write.

## Decision

- Reject an empty local command collection at the start of `deployCommands`,
  before serialization, logging, REST client creation, route construction, or
  network access.
- Keep `buildCommandPayload([])` valid as a pure serialization operation. The
  fail-closed policy belongs at the authenticated external-write boundary.
- Continue accepting an empty array returned by Discord after a nonempty
  deployment request.
- Do not provide a bypass, configuration switch, clear flag, or alternate
  command-clearing operation.
- Require separate user authorization and design review before introducing any
  intentional mechanism that clears all registered commands.

## Alternatives

- Allowing `PUT []` through the ordinary deployment function was rejected
  because an empty discovery result is indistinguishable from an intentional
  clear and can remove every registered command.
- Adding an `allowEmpty` flag was rejected because it weakens the default
  boundary and makes destructive behavior too easy to invoke accidentally.
- Rejecting an empty Discord response was rejected because the response is not
  the destructive input and may be a valid API result.

## Consequences

An unexpected empty command directory now fails locally without logging a
deployment attempt, constructing an authenticated REST client, or changing
Discord state. Normal nonempty guild deployment remains unchanged.

NitroBot has no built-in way to clear every registered command. If that
operation becomes necessary, it must be designed as an explicit maintenance
action with separate authorization, tests, and rollback guidance.
