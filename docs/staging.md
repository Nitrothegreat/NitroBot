# Staging Smoke Test

Use a Discord application and guild dedicated to staging. Never reuse a
production token or guild.

## Before starting

- The change is an open draft pull request from this repository.
- The staging workflow is dispatched from `main`, never from the task branch.
- The pull request does not change `.github/workflows/`; workflow changes are
  reviewed and merged separately before staging application code.
- `Quality gate`, `CodeQL / JavaScript`, and `Dependency review` are green for
  its current synthetic merge commit.
- The staging environment has `STAGING_DISCORD_TOKEN`,
  `STAGING_DISCORD_CLIENT_ID`, and `STAGING_DISCORD_GUILD_ID`.
- A human has approved the staging run.
- The pull request identifies the behavior and commands to validate.

## Smoke test

1. Register commands in the staging guild.
2. Start the bot and confirm the ready log names the staging bot.
3. Run every changed command and verify its visible response.
4. Check `/secretping` and all error responses are private where required.
5. Check guild-only behavior and unavailable-data fallbacks.
6. Confirm logs contain useful errors but no credentials or private payloads.
7. Stop the bot and confirm it disconnects cleanly.

The workflow validates required checks against the captured synthetic merge
commit, then checks out and runs the captured pull-request head commit. It
revalidates the base, head, and merge commit identities before requesting
staging credentials and again after environment approval. The preflight job
publishes the captured identities and required check-run IDs in its job
summary so the reviewer can confirm exactly what will execute.

Record the head commit, tested base and merge commits, tester, time, cases run,
results, and relevant sanitized logs in the pull request. A failure blocks
readiness until fixed and rerun.
