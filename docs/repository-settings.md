# Repository and Staging Setup

These controls live in GitHub and cannot be enforced by committed files alone.
The maintainer must configure and verify them.

## Main branch ruleset

Create a ruleset targeting `main`:

- Require changes through a pull request.
- Require the stable `Quality gate`, `CodeQL / JavaScript`, and
  `Dependency review` checks.
- Require the branch to be current before merge.
- Block force-pushes and branch deletion.
- Use zero required approvals while this remains a solo-maintainer repository.
- Do not allow Codex or automation to bypass the ruleset.
- Bind required check names to GitHub Actions as their expected source.

Automatic Codex review is advisory. The maintainer inspects the complete diff,
review findings, and verification evidence before taking a draft out of draft
state or merging it.

## Repository security

- Set the default GitHub Actions token permission to read-only and do not allow
  Actions to create or approve pull requests.
- Enable the dependency graph before requiring Dependency Review.
- Enable secret scanning and push protection.
- Enable Dependabot alerts and security updates.
- Review CodeQL and dependency-review findings rather than dismissing them to
  make a gate green.

## Protected staging environment

Create a GitHub environment named `staging`:

- Add the maintainer as a required reviewer. Allow self-review because this is
  currently a solo-maintainer repository.
- Disable environment-protection bypass where the repository plan supports it.
- Restrict deployment branches to `main` only. The trusted workflow runs from
  `main` and checks out the reviewed pull-request commit after its credential-
  free preflight; never allow a task branch to supply the workflow definition.
- Add `STAGING_DISCORD_TOKEN`, `STAGING_DISCORD_CLIENT_ID`, and
  `STAGING_DISCORD_GUILD_ID` as environment secrets.
- Use credentials from a dedicated Discord application and non-production
  guild with only the permissions NitroBot needs.

Only the maintainer dispatches the `main` branch version of
`.github/workflows/staging.yml`. Enter the open draft pull request number. The
preflight resolves its in-repository head commit and requires successful
`Quality gate`, `CodeQL / JavaScript`, and `Dependency review` check runs before
requesting environment approval. It rejects pull requests that change
`.github/workflows/`, because a task branch must not redefine the checks that
authorize staging credentials. Merge reviewed workflow-only changes separately
before staging application code. Approve the environment gate, monitor the
ten-minute session, perform
[the smoke test](staging.md), and record sanitized results and the tested
commit in the PR.

Treat every setting above as pending until its state is confirmed in GitHub.

## Bootstrap sequence

The foundation pull request introduces a transitional `npm run verify` that
runs the repository's existing ESLint check. After that pull request is merged,
the runtime modernization pull request strengthens the same stable command to
run linting, static type analysis, offline tests, and coverage enforcement.
The workflow always invokes `npm run verify`; it does not fall back when the
script is missing.

The staging workflow is trusted only after its definition is merged to `main`.
Open the runtime pull request against `main` after the foundation merge so its
synthetic merge commit receives the required pull-request checks.
