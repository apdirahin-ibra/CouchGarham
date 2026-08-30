# P1-02 — TanStack Start and Vercel guidance

**Status:** Verified for P1-03  
**Access date:** 2026-08-29  
**Scope:** Framework scaffold and Vercel deployment only

## Decision

Scaffold the application with the current official TanStack CLI, selecting **React + TypeScript + Vite**. Deploy the resulting TanStack Start application to Vercel through **Nitro's Vite plugin** and Vercel's built-in `tanstack-start` framework detection. Use **Node.js 24.x** locally, in CI, and on Vercel. Commit the generated lockfile and treat framework/deployment dependency upgrades as reviewed changes.

This satisfies P1-02's acceptance criterion: the supported version policy and deployment integration are recorded before P1-03 starts.

## Verified maturity and versions

The following values are a point-in-time observation, not an instruction to replace the versions selected by the official scaffold independently:

| Component | Verified state on 2026-08-29 | P1-03 policy |
|---|---|---|
| TanStack Start | The official overview still labels Start **Release Candidate**: feature-complete and API-stable, but not guaranteed bug-free. npm's `latest` package was `@tanstack/react-start` **1.168.30**. | Use the stable/default CLI selection, never alpha/beta/canary tags. Keep Start and Router on the mutually compatible versions produced by the scaffold; commit the lockfile. |
| TanStack CLI | Official command is `npx @tanstack/cli@latest create`; npm reported CLI **0.70.2**. | Invoke `@tanstack/cli@latest` once for scaffolding and record the actually resolved CLI and generated dependency versions in the P1-03 evidence. Do not keep the CLI as a floating runtime dependency. |
| React | npm's `latest` was **19.2.8**. | Accept the stable React/React DOM pair selected by the scaffold. Do not choose `next`, canary, experimental, beta, or RC tags. |
| Vite | npm's `latest` was **8.2.2**; TanStack officially supports Vite and Rsbuild. | Select Vite, as required by the rebuild direction. Accept the scaffold's compatible stable Vite and React plugin versions; do not force-upgrade across peer constraints. |
| Nitro | TanStack's current Vercel instructions use `nitro` and `nitro/vite`. Vercel documents that this first-party Vite plugin ships in **Nitro v3**. npm's `latest` package was **3.0.260610-beta**, so the documented integration currently entails a prerelease Nitro line; TanStack also warns that the plugin is under active development. | Prefer the dependency/version resolved by the current official TanStack/Vercel scaffold or template. For manual setup, follow the official `npm install nitro` command and use `nitro/vite`; currently this means accepting the v3 prerelease resolved by npm rather than forcing stable v2, which does not provide the documented first-party plugin. Record and lock the exact resolved version. |
| Node.js | Node.js **24.x** is LTS; **22.x** remains LTS; 20.x is EOL. Vercel documents 24.x as its default and supports selecting a major through `package.json`. | Standardize on 24.x and add `"engines": { "node": "24.x" }` in P1-03. Match local/CI/Vercel majors. Do not use Node 20 even if it remains selectable on an older Vercel project. |

Version-selection rules:

1. The generated lockfile is the reproducibility authority for P1-03; commit it with the scaffold.
2. Do not use broad prerelease tags or manually force the individually newest Start, Router, Vite, React, or Nitro packages.
3. Keep `@tanstack/react-start` and `@tanstack/react-router` aligned with the scaffold-generated compatible set.
4. Pin the package-manager version in `package.json` and use frozen-lockfile installs in CI after scaffolding.
5. Because Start remains RC and Nitro's Vite integration is actively developed, schedule framework updates deliberately and rerun build, SSR, route navigation, and server-function smoke tests after every update.
6. Recheck the official TanStack hosting page and Vercel guide immediately before P1-11 and production deployment.

## Scaffold guidance for P1-03

Use the official CLI rather than assembling the project by hand:

```sh
npx @tanstack/cli@latest create
```

Selections:

- Framework: TanStack Start for React.
- Language: TypeScript.
- Build tool: Vite.
- Routing: generated file-based TanStack Router setup.
- Optional scaffold additions: Tailwind and ESLint may be selected when offered, but the broader dependency/configuration work remains P1-04 and P1-05.
- Avoid experimental React Server Components. TanStack describes RSC support as experimental through the RC and early v1; this application does not need it.

If the CLI cannot produce a clean scaffold, the supported manual fallback is the official "Build a Project from Scratch" guide. Its Vite configuration uses this plugin order:

```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tanstackStart(), viteReact()],
})
```

TanStack explicitly requires the React Vite plugin to come after the Start plugin. Its TypeScript baseline uses `moduleResolution: "Bundler"`, `module: "ESNext"`, `target: "ES2022"`, and `strictNullChecks: true`. The guide warns that `verbatimModuleSyntax` can leak server bundles into client bundles, so keep it disabled unless later official guidance changes.

Before P1-03 is accepted, capture:

- the CLI version actually invoked;
- `node --version` and package-manager version;
- the generated Start, Router, React, Vite, TypeScript, and plugin versions;
- successful development startup and `npm run build` (or the chosen package-manager equivalent).

## Vercel deployment integration

Current TanStack and Vercel guidance agrees on Nitro for TanStack Start on Vercel.

For a Vite scaffold, the expected deployment shape is:

```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tanstackStart(), nitro(), viteReact()],
})
```

Important details:

- Preserve plugin order: Start, Nitro, then React.
- Vercel automatically detects TanStack Start and Nitro, populating the build command and output directory. No custom adapter package is documented.
- The Vercel framework preset must read **TanStack Start**. If auto-detection fails (notably in a monorepo or previously configured project), add the minimal override:

  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "framework": "tanstack-start"
  }
  ```

- Do not set a custom output directory when detection succeeds. Nitro builds use `.output`; overriding this incorrectly can break routing.
- The normal build script remains `vite build`. For self-hosted Node verification, TanStack documents `node .output/server/index.mjs`; Vercel itself consumes the Nitro output through its detected integration.
- No explicit Nitro `preset` is required by the current Vercel guide. Prefer zero configuration. Add a preset only if current official guidance or a verified build requires one.
- Do not create catch-all rewrites for SSR routes. A deployed app whose secondary routes return 404 should first be checked for missing/misordered `nitro()` and an incorrect framework preset/output override.
- Vercel server functions default to the Node.js runtime. This project's PostgreSQL/auth server code should remain on Node, not Edge, unless a later task proves all dependencies Edge-compatible.
- Never put secrets in `VITE_`-prefixed environment variables; Vercel warns that those values ship to the browser.

Deployment verification for P1-11 should include SSR content, direct navigation to a non-root route, client navigation, and one server-function request—not only a successful build.

## Known caveats and go/no-go check

- **TanStack Start remains RC.** The API is described as stable, but production risk is higher than for a final stable framework release. Lock versions and require explicit upgrade verification.
- **Nitro Vite is actively developed and currently requires Nitro v3.** Vercel documents that the first-party `nitro/vite` plugin ships inside Nitro v3, while npm currently resolves `nitro` to a v3 beta. Prefer the official template/scaffold-compatible result; for manual setup, follow the official unversioned install and accept/pin the resolved v3 prerelease rather than forcing v2.
- **RSC is experimental.** Do not opt into it for this rebuild.
- **Documentation is moving quickly.** The presence of older TanStack pages with outdated adapter/preset details is not sufficient evidence. Use the current `tanstack.com/start/latest` and current Vercel guide cited below.

P1-03 may proceed if its agent follows the CLI-first, Vite, Node 24, lockfile, and Nitro compatibility rules above. A Nitro v3 prerelease is expected for the documented `nitro/vite` integration and is not an automatic blocker, but the agent must pin the exact version, verify a local production build, and record the result before P1-11.

## Official sources

All sources were accessed 2026-08-29.

- [TanStack Start overview and RC status](https://tanstack.com/start/latest/docs/framework/react/overview)
- [TanStack Start getting started and official CLI](https://tanstack.com/start/latest/docs/framework/react/getting-started)
- [TanStack Start build-from-scratch guidance](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch)
- [TanStack Start hosting guidance, including Nitro and Vercel](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [TanStack announcement: Start v1 Release Candidate](https://tanstack.com/blog/announcing-tanstack-start-v1)
- [TanStack RSC maturity caveat](https://tanstack.com/blog/react-server-components)
- [Vercel: Deploy a TanStack Start app](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel)
- [Vercel: What is the Nitro Vite plugin?](https://vercel.com/kb/guide/nitro-vite-plugin)
- [Vercel: supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json)
- [Node.js release status](https://nodejs.org/en/about/previous-releases)
- [npm: `@tanstack/react-start`](https://www.npmjs.com/package/@tanstack/react-start)
- [npm: `@tanstack/cli`](https://www.npmjs.com/package/@tanstack/cli)
- [npm: React](https://www.npmjs.com/package/react)
- [npm: Vite](https://www.npmjs.com/package/vite)
- [npm: Nitro](https://www.npmjs.com/package/nitro)
- [Nitro repository and stable-line notice](https://github.com/nitrojs/nitro)
