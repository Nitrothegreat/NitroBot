# NitroBot Agent Guide

## Project

NitroBot is a small Discord bot built with Node.js 22+, native ES modules, and
discord.js. Production code lives in `src/`, maintenance entry points live in
`scripts/`, and offline tests live in `test/`.

Preserve these invariants:

- Request only the Discord gateway intents the bot actually needs.
- Keep slash commands guild-scoped unless the user explicitly changes that
  product decision.
- Validate configuration before network access. Never expose secret values in
  errors, logs, tests, commits, or responses.
- Give Discord users generic private failure messages and log useful internal
  details locally.
- Keep tests offline. Inject network boundaries instead of using Discord
  credentials in tests.
- Never run `npm run deploy`, connect a bot, write external state, merge, or
  change repository settings without explicit authorization.

Read [docs/architecture.md](docs/architecture.md) before changing runtime
structure, configuration, dependencies, Discord behavior, or deployment. Read
[docs/code-review.md](docs/code-review.md) before reviewing a change.

## Working Agreement

At the start of a coding task:

1. Inspect `git status` and preserve all existing work.
2. Turn the request into concrete acceptance criteria.
3. Run the relevant existing checks before editing when practical. Record
   pre-existing failures separately from regressions.
4. Classify the change as low, medium, or high risk using the review guide.

Within an approved coding request, Codex may inspect, edit, add justified
development dependencies after architecture and security review, test, commit,
push its `codex/` task branch without force, and create or update its draft pull
request. New runtime dependencies and changes to workflow authority require
explicit approval. Do not push to `main`, create tags or releases, mark a pull
request ready, approve or merge it, deploy, use production credentials, weaken
a gate, or materially expand scope. Capture unrelated improvements as
follow-up notes.

Use small, coherent changes. Verify framework or Discord API behavior against
official documentation when version-specific behavior matters. Add or update
behavior-focused tests for every behavior change and regression fix.

## Specialist Reviews

Use project agents from `.codex/agents/` as follows:

- Spawn `architect` before new features or changes to public commands,
  dependencies, configuration, module boundaries, Discord intents or
  permissions, networking, secrets, concurrency, or multiple production
  subsystems.
- Spawn `security_reviewer` for changes involving user-controlled input,
  permissions, secrets, logging, dependencies, network calls, filesystem
  access, or deployment.
- Spawn `qa_reviewer` after every source-code change.

Specialists are read-only. Give reviewers the original requirements,
acceptance criteria, and complete diff—not the implementer's conclusions.
Resolve confirmed findings, rerun verification, and repeat affected reviews.
Do not stop with a known correctness, security, or test failure.

## Verification

During development, run the narrowest relevant tests. Before reporting a code
task complete or updating a draft pull request, run:

```bash
npm run verify
```

For documentation-only changes, inspect links and rendered structure; source
checks are optional when no executable or configuration file changed.

Never claim a command passed unless it was run successfully in the current
worktree. If a required check cannot run, state exactly why and treat the work
as unverified.

Before a remote write, inspect the complete diff and status for credentials or
unrelated files and rerun `npm run verify`. Repository protections and secret
scanning complement this check; do not assume they are configured until their
GitHub settings have been verified.

## Code Review Rules

Follow [docs/code-review.md](docs/code-review.md). Prioritize correctness,
security, regressions, Discord interaction timing/acknowledgement, error
handling, and meaningful missing tests. Avoid style-only findings unless they
hide a real defect.

## Completion Report

Report:

- Behavior and interfaces changed.
- Verification commands actually run and their results.
- Specialist findings and how they were resolved.
- Remaining limitations, risks, staging needs, and follow-up work.

After an escaped defect or repeated review miss, propose improving the
strongest durable layer: a regression test, static rule, CI gate, architecture
rule, or focused review check. Do not add one-off cautions to this file.
