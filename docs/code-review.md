# Code Review Guide

## Risk classification

- **Low:** Documentation or an isolated implementation change with no public,
  configuration, dependency, permission, network, or error-contract impact.
- **Medium:** A new or changed command, routing behavior, module contract, or
  multi-file runtime change.
- **High:** Secrets, permissions/intents, dependencies, deployment, external
  writes, user-controlled data reaching a sensitive sink, or broad
  architectural change.

Medium and high-risk changes require architecture review. Changes matching a
security-sensitive category require security review. Every source change
requires independent QA.

## Review order

1. Compare the result with every acceptance criterion.
2. Trace changed execution paths, including failure and retry behavior.
3. Check Discord acknowledgement state and privacy flags.
4. Check secret handling, permissions, untrusted input, logs, and external
   effects.
5. Check compatibility with Node 22+, ESM, and current module contracts.
6. Look for regressions outside the immediate happy path.
7. Confirm tests would fail without the intended behavior and cover meaningful
   boundaries rather than implementation details.
8. Confirm docs, configuration examples, and operational notes match behavior.

## Finding standard

Report only actionable findings. Each finding includes:

- Severity: blocking, high, medium, or low.
- A precise file and line or symbol.
- The concrete failure mode and affected user or operator.
- Reproduction or reasoning sufficient to verify it.
- The smallest safe correction or missing test.

Do not report formatting preferences already enforced by tools. If no findings
remain, state what was reviewed, what commands ran, and any residual validation
gap.

## Completion gate

A code change is not ready for a draft-PR update while any of these remain:

- An unmet acceptance criterion.
- A failing lint, type, test, or coverage gate caused by the change.
- A blocking/high correctness or security finding.
- An unexplained change to permissions, secrets, dependencies, or external
  behavior.
- Required staging or rollback evidence omitted from the PR.
