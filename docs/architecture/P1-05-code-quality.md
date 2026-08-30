# P1-05 — TypeScript, linting, and formatting evidence

## Acceptance criterion

`IMPLEMENTATION_TASKS.md` defines P1-05 as complete when type-check, lint, and
formatting checks run from package scripts.

## Configuration

- `tsconfig.json` keeps `strict`, `noEmit`, unused-code checks, and
  `verbatimModuleSyntax: false`; it also enables isolated-module checking and
  consistent file-name casing.
- `eslint.config.js` uses ESLint flat config with the recommended JavaScript,
  TypeScript, React Hooks, and Vite React Refresh rules. TanStack file-route
  modules have a narrow Fast Refresh exception because their required route
  export is intentionally colocated with the component.
- `.prettierignore` excludes generated/build/test output, the generated
  `src/routeTree.gen.ts`, specifications, project-management records, and
  documentation.
- `prettier.config.mjs` records the scaffold's existing no-semicolon,
  single-quote style.
- Formatting scripts enumerate application and tooling config inputs rather
  than formatting the repository indiscriminately.

## Tool versions

The versions recorded by `package.json` and `package-lock.json` are:

| Tool | Version range |
| --- | --- |
| ESLint | `^10.9.1` |
| `@eslint/js` | `^10.0.1` |
| typescript-eslint | `^8.68.0` |
| React Hooks ESLint plugin | `^7.1.1` |
| React Refresh ESLint plugin | `^0.5.5` |
| globals | `^17.11.0` |
| Prettier | `^3.9.6` |
| TypeScript | `^6.0.2` |

## Package scripts

| Script | Purpose |
| --- | --- |
| `npm run type-check` | Run TypeScript with no output emission. |
| `npm run lint` | Lint application and supported tooling configuration files. |
| `npm run format:check` | Verify formatting of explicitly scoped source/config files. |
| `npm run format` | Mechanically format the same explicit scope. |

## Verification

Verified on 2026-08-29 from `D:\\CouchGarham`:

| Command | Result |
| --- | --- |
| `npm run type-check` | Passed, exit code 0. |
| `npm run lint` | Passed with no warnings or errors, exit code 0. |
| `npm run format:check` | Passed: all matched files use Prettier style, exit code 0. |
| `npm run build` | Passed: client, SSR, and Nitro production output built, exit code 0. |

Running `npm run format` before verification reported all scoped files unchanged.
No generated route, planning, tracker, specification, or product behavior file
was modified by formatting.

The dependency install reported four moderate npm audit findings. They were not
automatically changed because remediation is outside P1-05 and may involve
breaking dependency updates.
