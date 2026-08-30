# P1-09 — Test runners

## Scope

P1-09 configures isolated sample suites without changing application behavior:

- `npm run test:unit` runs Node-based unit tests from `tests/unit`.
- `npm run test:component` runs React Testing Library tests in jsdom from
  `tests/component`, with shared cleanup and `jest-dom` matchers.
- `npm run test:e2e` runs Playwright tests from `tests/e2e` in Chromium.

Each runner fails when its configured test directory contains no matching tests.
Tests execute serially with one worker where applicable so the foundation suite is
deterministic and suitable for later CI integration.

## Browser setup

Playwright starts the existing TanStack Start development server at
`http://127.0.0.1:3000`, does not reuse an unrelated server, and tests the starter
page in the bundled Desktop Chrome device profile. Install the project-pinned
Chromium binary with `npx playwright install chromium` only when the runtime is
not already present.

## Verification

P1-09 is accepted when the following commands all pass:

```text
npm run type-check
npm run lint
npm run format:check
npm run test:unit
npm run test:component
npm run test:e2e
npm run build
```

Verified on 2026-08-29:

| Command | Result |
| --- | --- |
| `npm run type-check` | Passed |
| `npm run lint` | Passed |
| `npm run format:check` | Passed |
| `npm run test:unit` | Passed, 1 file and 1 test |
| `npm run test:component` | Passed, 1 file and 1 test |
| `npm run test:e2e` | Passed, 1 Chromium test |
| `npm run build` | Passed, client, SSR, and Nitro output generated |

The installed project-pinned browser is Playwright Chromium v1234 (Chrome for
Testing 151.0.7922.34), including its headless shell. The browser is stored in
Playwright's user runtime cache and is not committed to the repository.
