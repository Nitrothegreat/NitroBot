# ADR-0001: Trusted quality and staging foundation

- Status: accepted
- Date: 2026-07-25

## Context

NitroBot needs a stable branch-protection check and a staging path that can run
pull-request code with dedicated Discord credentials. A task branch must not be
able to redefine the workflows or checks that authorize those credentials.

The repository is adopting these controls in two stages. The foundation change
must run against the legacy CommonJS layout, while the follow-up runtime change
introduces the final ESM structure, offline tests, type analysis, and coverage
gate.

## Decision

- Establish `Quality gate` as the stable required-check contract.
- In the foundation, define `npm run verify` as the existing ESLint check and
  run it unconditionally on Node.js 22.21.0 and Node.js 24.
- In the runtime follow-up, strengthen the same command to run linting, static
  type analysis, offline tests, and coverage without changing the workflow.
- Run CodeQL and dependency review on pull requests targeting `main`.
- Keep ordinary verification credential-free and install locked dependencies
  with lifecycle scripts disabled.
- Dispatch staging only from the workflow definition trusted on `main`.
- Reject staging for forked pull requests or pull requests that change workflow
  files.
- Evaluate required checks on the captured synthetic merge commit, but check
  out and execute the captured pull-request head commit.
- Bind the captured base, head, and merge identities before environment
  approval and revalidate them after approval before checking out pull-request
  code.
- Expose Discord credentials only to explicit deploy and runtime steps in a
  protected, human-approved staging environment.
- Keep command registration guild-scoped and omit production deployment.

## Alternatives

- An adaptive workflow that falls back when `npm run verify` is absent was
  rejected because a later change could delete the script and silently receive
  a weaker green check.
- Staging directly from a task-branch workflow was rejected because the code
  receiving credentials could redefine its own authorization checks.
- Checking only the pull-request head was rejected because CodeQL and
  dependency-review results apply to GitHub's synthetic merge commit.
- Executing the synthetic merge commit was rejected because staging should run
  the exact reviewed source commit while CI separately proves merge
  compatibility.

## Consequences

The foundation gate initially proves locked installation and lint compliance,
not runtime behavior. The follow-up runtime pull request strengthens that gate
and supplies the offline behavioral evidence.

Staging is unavailable for the workflow-changing foundation pull request. Once
the foundation is merged and repository settings are configured, runtime pull
requests can use the trusted workflow. Staging fails closed if the pull request,
its base, its head, its synthetic merge commit, its required checks, or its
workflow file set changes.

Repository rules, required-check source binding, dependency graph, Actions
permissions, protected-environment reviewers, and secrets remain maintainer-
configured controls that must be verified in GitHub.
