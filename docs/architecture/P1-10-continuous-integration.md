# P1-10 — Continuous integration

## Scope

P1-10 adds a GitHub Actions workflow at `.github/workflows/ci.yml`. It verifies
the repository on every push, every pull request, and manual dispatch without
deploying or requiring application credentials.

The workflow runs the four acceptance gates for P1-10:

- TypeScript type-checking.
- ESLint.
- Unit tests.
- Production build.

It also runs the existing jsdom component suite because that suite is fast,
deterministic, and requires no browser installation. Playwright/E2E is excluded
from this foundation workflow; P1-10 does not require browser verification and
the production build already verifies the application bundle.

## Runtime and dependency installation

The workflow uses `ubuntu-latest`, Node.js `24.x`, and asserts that npm's major
version is 11. These match `package.json` (`engines.node` and `packageManager`).
Dependencies are installed with `npm ci`, so `package-lock.json` remains the
authoritative dependency graph.

`actions/setup-node` provides npm download-cache reuse keyed from
`package-lock.json`. The cache contains npm's package data, not `node_modules`,
and `npm ci` still performs a clean, lockfile-enforced install on each run.

## Security and execution controls

- Workflow permissions are limited to read-only repository contents.
- Checkout credential persistence is disabled.
- Official actions are pinned to immutable commits:
  - `actions/checkout` v7.0.1 at
    `3d3c42e5aac5ba805825da76410c181273ba90b1`.
  - `actions/setup-node` v7.0.0 at
    `820762786026740c76f36085b0efc47a31fe5020`.
- Concurrency cancellation stops obsolete runs for the same workflow and Git
  ref.
- A 20-minute job timeout bounds stalled execution.
- No secrets, environment credentials, Supabase keys, or Vercel credentials are
  referenced.

The action versions were checked against the official
[`actions/checkout` releases](https://github.com/actions/checkout/releases) and
[`actions/setup-node` releases](https://github.com/actions/setup-node/releases)
on 2026-08-29.

## Workflow commands

After runtime verification, CI invokes these repository commands in order:

```text
npm ci
npm run type-check
npm run lint
npm run test:unit
npm run test:component
npm run build
```

## Local verification

P1-10 is accepted when the workflow parses as YAML, exposes the intended
triggers and one verification job, has no secret references, and every command
listed above passes locally against the committed lockfile.

Verified on 2026-08-29 with Node.js 24.15.0 and npm 11.12.1:

| Check | Result |
| --- | --- |
| YAML parse and structural assertions | Passed |
| Trigger assertions (`push`, `pull_request`, `workflow_dispatch`) | Passed |
| Required job/command assertions | Passed |
| Secret-reference scan | Passed; no `secrets.*` reference |
| `npm ci` | Passed; 401 packages installed from the lockfile |
| `npm run type-check` | Passed |
| `npm run lint` | Passed |
| `npm run test:unit` | Passed; 1 file and 1 test |
| `npm run test:component` | Passed; 1 file and 1 test |
| `npm run build` | Passed; client, SSR, and Nitro output generated |

`npm ci` reported four moderate findings already documented for the dev-only
Drizzle Kit dependency chain in P1-04. P1-10 did not alter dependencies or use
the breaking forced audit fix.
