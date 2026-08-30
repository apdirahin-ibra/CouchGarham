# P1-04 — Core dependencies and minimal integration evidence

**Date:** 2026-08-29  
**Scope:** Install the rebuild stack's core libraries and prove that Tailwind and TanStack Query integrate with the existing TanStack Start scaffold. Test-runner, database, authentication, environment, and product configuration remain later tasks.

## Acceptance criterion

P1-04 requires Router, Query, Tailwind, Zod, Drizzle, Better Auth, Supabase, icons, and the specified test dependencies to be configured. Router and Start were established by P1-03. This task retained that scaffold and added the remaining packages without adding domain schema, auth flows, environment handling, or test-runner configuration.

## Installed direct dependencies

The versions below are the exact versions resolved in `package-lock.json` after installation. `package.json` retains npm semver ranges for newly added packages and the scaffold's existing version declarations.

### Runtime

| Package | Resolved version | P1-04 role |
| --- | ---: | --- |
| `@tanstack/react-query` | 5.102.8 | Server-state cache and mutations |
| `@tanstack/react-router-ssr-query` | 1.167.2 | Start/Router-aware SSR Query integration |
| `tailwindcss` | 4.3.3 | Utility-first styling |
| `@tailwindcss/vite` | 4.3.3 | Tailwind v4 Vite integration |
| `zod` | 4.5.4 | Runtime validation |
| `drizzle-orm` | 0.45.2 | Typed database access |
| `postgres` | 3.4.9 | PostgreSQL driver for the later Supabase pooler setup |
| `better-auth` | 1.7.2 | Authentication/session library for later configuration |
| `@supabase/supabase-js` | 2.112.4 | Supabase Storage/platform SDK |
| `lucide-react` | 1.37.0 | React icon set |

### Development and test tooling

| Package | Resolved version | P1-04 role |
| --- | ---: | --- |
| `drizzle-kit` | 0.31.10 | Migration generation tooling for P3-02 |
| `vitest` | 4.1.11 | Unit/component test runner |
| `@vitest/ui` | 4.1.11 | Optional Vitest UI |
| `@vitest/coverage-v8` | 4.1.11 | Vitest coverage provider |
| `jsdom` | 30.0.1 | Browser-like component-test environment |
| `@testing-library/react` | 16.3.3 | React component testing |
| `@testing-library/jest-dom` | 7.0.1 | DOM assertions |
| `@testing-library/user-event` | 14.6.6 | User interaction simulation |
| `@playwright/test` | 1.62.1 | End-to-end test runner |

No Playwright browser binaries were downloaded in P1-04. P1-09 owns runner configuration, scripts, setup files, sample tests, browser installation, and execution.

## Minimal configuration

- `vite.config.ts` registers `@tailwindcss/vite` while preserving the P1-03 Start → Nitro → React relative plugin order.
- `src/styles.css` imports Tailwind v4 with `@import 'tailwindcss';`; existing scaffold CSS remains intact.
- `src/router.tsx` creates one `QueryClient` for each router instance and calls `setupRouterSsrQueryIntegration`. The integration wraps the Start router in `QueryClientProvider` and enables Query dehydration/hydration for SSR.
- No Tailwind design tokens were added; P2-01 owns the visual token system.
- No Drizzle config/schema, Better Auth config, Supabase client, or environment module was added; those belong to P3, P4, and P1-06.

## Compatibility evidence

The dependency tree resolves a single `@tanstack/react-router` 1.170.32 for the app, Start, Query integration, and Better Auth. `@tanstack/react-start` remains the existing scaffold declaration and resolves to 1.168.49. Nitro remains locked at 3.0.260610-beta as recorded by P1-02/P1-03. The installation did not force framework, Router, Nitro, React, or Vite version changes outside the scaffold's existing declared ranges.

## Verification

Commands are executed with the workspace's Node.js 24/npm 11 toolchain.

| Check | Result |
| --- | --- |
| `npm list --depth=0` | Passed; all direct dependencies resolve |
| `npm list @tanstack/react-router @tanstack/react-start @tanstack/react-router-ssr-query @tanstack/router-ssr-query-core --all` | Passed; Router is deduplicated and all peer requirements resolve |
| `npm audit --json` | Completed; 0 critical, 0 high, 4 moderate findings, all in the development-only `drizzle-kit` → deprecated `@esbuild-kit/*` → `esbuild@0.18.20` chain |
| `npm run build` | Passed with exit code 0; Vite built client, SSR, and Nitro environments and generated `.output/nitro.json` |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed with exit code 0 |
| Tailwind output inspection | Passed; the generated stylesheet identifies Tailwind CSS 4.3.3 and contains its base/utilities layers |
| Query SSR output inspection | Passed; Nitro emitted the Router Query integration, React Query, and Query Core server bundles |

The audit's suggested automatic remediation is `npm audit fix --force`, which would downgrade direct `drizzle-kit` from 0.31.10 to 0.18.1 as a breaking change. It was deliberately not applied: the advisory affects the deprecated loader used by migration CLI tooling and its development server, not the application runtime, and a forced ORM-tool downgrade is less safe than retaining the current stable Drizzle Kit until its upstream dependency is replaced. This finding should remain visible in dependency-update reviews.

The production build transformed 172 client modules, 51 SSR modules, and 224 Nitro modules with Vite 8.2.2. Nitro used the `node-server` preset and emitted the Query integration into the server output, providing a focused smoke check that the integration is included in the actual production graph.
