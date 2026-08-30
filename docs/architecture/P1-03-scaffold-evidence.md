# P1-03 — TanStack Start scaffold evidence

**Recorded:** 2026-08-29  
**Scope:** Minimal official TanStack Start scaffold only

## Scaffold command

```powershell
& 'C:\Program Files\nodejs\npx.cmd' --yes '@tanstack/cli@latest' create couch-garham --framework React --blank --deployment nitro --package-manager npm --no-toolchain --no-intent --no-git --target-dir '.scaffold-p103' --non-interactive
```

The temporary scaffold was merged into the existing repository root so the pre-existing specification, plans, audit records, workflow files, repository metadata, and `.gitignore` were preserved.

## Toolchain

| Component | Resolved version |
|---|---:|
| TanStack CLI | 0.70.2 |
| Node.js | 24.15.0 |
| npm | 11.12.1 |
| Corepack | 0.34.6 |

`package.json` pins `npm@11.12.1` in `packageManager` and Node `24.x` in `engines`. The generated npm lockfile is present and is the reproducibility authority intended for the baseline commit; the repository does not yet have a commit.

## Generated core dependencies

| Package | Resolved version |
|---|---:|
| `@tanstack/react-start` | 1.168.49 |
| `@tanstack/react-router` | 1.170.32 |
| `react` | 19.2.8 |
| `react-dom` | 19.2.8 |
| `vite` | 8.2.2 |
| `typescript` | 6.0.3 |
| `@vitejs/plugin-react` | 6.1.1 |
| `nitro` | 3.0.260610-beta |
| `@tanstack/router-cli` | 1.167.33 |

The official blank scaffold selected React, TypeScript, Vite, file-based routing, and Nitro. No Tailwind, examples, toolchain, tests, Intent mappings, or other optional add-ons were selected.

## Verified integration

The generated Nitro v3 dependency was retained without forcing Nitro v2. `vite.config.ts` follows the verified plugin order: TanStack Start, Nitro, then React. `verbatimModuleSyntax` is disabled per the P1-02 server-bundle safety guidance.

## Acceptance evidence

Production build command:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
```

Result: passed with exit code 0. Vite 8.2.2 transformed 125 client modules, 51 SSR modules, and 177 Nitro modules. Nitro used the `node-server` preset and generated `.output/public`, `.output/server/index.mjs`, and `.output/nitro.json`.

Development command:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run dev -- --host 127.0.0.1
```

Result: Vite 8.2.2 became ready on `http://127.0.0.1:3000/`. A direct HTTP request returned status 200 and server-rendered HTML containing `Welcome to TanStack Start`. The development process was stopped after verification.
