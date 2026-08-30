# Repository workflow

## Main branch

`main` is the integration branch and should remain deployable. Do not commit feature work directly to it once collaboration begins; merge reviewed branches after their checks pass.

## Branch names

Create a short-lived branch from the latest `main`. Use the backlog task ID followed by a concise kebab-case description:

```text
feature/p4-01-player-schema
fix/p5-09-attendance-race
docs/p1-01-repository-workflow
test/p8-05-authorization
chore/p1-04-dependencies
```

Use `feature/`, `fix/`, `docs/`, `test/`, or `chore/` to describe the branch's purpose. Keep one backlog task per branch unless the tracker explicitly records a combined delivery.

## Commits

Use focused commits with an imperative Conventional Commit subject and the task ID in parentheses:

```text
feat(players): add roster schema (P4-01)
fix(attendance): prevent stale status writes (P5-09)
docs(repo): define contribution workflow (P1-01)
```

- Commit only files belonging to the task.
- Do not commit secrets, local environment files, generated build output, dependency directories, or test artifacts.
- Commit migrations and lockfiles whenever the related source change requires them.
- Before requesting review, rebase or merge the latest `main`, resolve conflicts deliberately, and run the task's required checks.

## Review and merge

Open a pull request that names the task, summarizes behavior and data changes, lists verification performed, and calls out migrations or environment-variable changes. Prefer squash merging for a clean task-level history unless preserving separate commits adds useful operational context. Delete the short-lived branch after merge.

## Baseline repository setup

The repository starts on `main`. The initial baseline commit should include only reviewed project documentation and foundation files; repository initialization itself does not require an empty commit.
