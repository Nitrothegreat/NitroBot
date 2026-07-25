# ADR-0004: Allowlisted operational error diagnostics

- Status: accepted
- Date: 2026-07-25

## Context

ADR-0002 requires caught errors to be reduced before logging because Discord
errors can retain tokens, callback URLs, request bodies, and private content.
Applying that generic reduction to NitroBot's own configuration, module, and
deployment invariant failures also removes safe facts that operators need, such
as which configuration variable or local module caused startup to fail.

The diagnostic boundary must become more useful without admitting arbitrary
error messages, causes, paths, payloads, environment values, or forged fields.

## Decision

- Represent locally authored invariant failures with a dedicated
  `OperationalError` carrying module-private metadata.
- Assign each supported failure a fixed reason code. The reason code determines
  the only context fields that may be emitted.
- Permit configuration failures to emit only one of the three known Discord
  environment-variable names.
- Permit command and event loader failures to emit only a constrained local
  JavaScript basename.
- Permit deployment invariant failures to emit no context.
- Do not parse error messages or copy arbitrary error properties into logs.
- Treat ordinary, external, forged, or malformed errors as generic errors.
  Preserve only bounded numeric own-data `code` and `status` fields.
- Make diagnostic reduction total: ignore accessor-backed diagnostic fields,
  and degrade values whose inspection itself throws to a fixed unknown-error
  shape rather than letting them escape the logger.
- Continue omitting raw messages, causes, environment values, absolute paths,
  URLs, headers, request and response bodies, tokens, IDs, and Discord payloads.

This decision supersedes ADR-0002 only where that decision limited all useful
diagnostics to generic type and numeric fields. Its confidentiality constraints
remain in force.

## Alternatives

- Logging raw locally authored messages was rejected because message provenance
  can drift and later interpolate sensitive values.
- Copying `reason` or `context` properties from arbitrary `Error` objects was
  rejected because external errors can forge those fields.
- Parsing existing messages into structured details was rejected because it is
  brittle and makes the sanitizer depend on unsafe text.
- Adding a logging dependency or external telemetry was rejected as unnecessary
  scope and a new data boundary.

## Consequences

Startup and deployment logs can identify safe configuration, local module, and
deployment invariant failures without exposing their raw messages or values.
Discord and other external errors retain the existing generic diagnostic
contract.

Adding a new operational reason requires updating the trusted producer, the
reason-specific formatter allowlist, tests, and this decision's security review.
