# BEST OFFICIAL APP — Project Tracker

Last updated: 2026-08-30

The detailed backlog and acceptance criteria are in `IMPLEMENTATION_TASKS.md`. Update this file whenever work starts, finishes, becomes blocked, or a project decision changes.

## Overall status

| Field | Value |
|---|---|
| Project state | Paused by owner |
| Current phases | Phase 0 — Source-of-truth capture; Phase 1 — Repository and foundation |
| Overall progress | 13 / 112 tasks complete (11.6%) |
| Active tasks | None; all agents stopped by owner. |
| Ready queue | P1-07 and P1-11 remain ready, queued by capacity. |
| Blocked external-input queue | P0-01, P0-05, P7-01 |
| Production readiness | Not ready |

## Orchestration control

| Field | Policy / current state |
|---|---|
| Orchestrator role | Verify, organize, schedule, and track only; never implement backlog deliverables. |
| Backlog authority | `IMPLEMENTATION_TASKS.md` task IDs, dependencies, and acceptance criteria. |
| Status authority | This tracker; worker claims are provisional until orchestrator verification. |
| Scheduling rule | Dispatch every dependency-ready task up to the live-agent limit, provided concurrent write scopes do not overlap. |
| Dependency rule | Tasks with unmet dependencies wait; an unrelated blocker must not stop ready work on another branch. |
| Worker isolation | One bounded backlog task and one context per sub-agent. Unrelated task IDs are never bundled. |
| Verification rule | Review deliverables, relevant diffs/files, acceptance criteria, and test/build evidence before marking `Done`. Use an independent verifier when read-only orchestration checks are insufficient. |
| Shared-workspace rule | Record intended write scope before dispatch and sequence workers that would edit the same files. |
| Current gate | Initial queue acknowledged; dependency-aware dispatch is active. |

### Task execution ledger

| Task | Status | Dependencies | Agent/owner | Write scope | Started | Verified/completed | Evidence or blocker |
|---|---|---|---|---|---|---|---|
| P0-01 | Blocked | — | Unassigned | Source artifact / parity documentation | — | — | The required 17-page Complete System Specification is not present in the workspace. |
| P0-02 | Done | — | `p0_02_source_availability` | `docs/source-audit/P0-02-current-source-availability.md` only | 2026-08-29 | 2026-08-29 | Orchestrator verified the report, workspace inventory, absence of source indicators/pointers, and scope compliance; fallback acceptance condition is satisfied. |
| P0-05 | Blocked | — | Unassigned | Secure migration-input location | — | — | No `club-data` or `club-gallery` export is present in the workspace. |
| P1-01 | Done | — | `p1_01_repository_init` | `.git` metadata, root `.gitignore`, `docs/process/repository-workflow.md` only | 2026-08-29 | 2026-08-29 | Verified empty repository on `main`, correct ownership, expected ignore rules, trackable `.env.example`, documented branch/commit conventions, and restored normal sandbox tooling. |
| P1-02 | Done | — | `p1_02_stack_guidance` | `docs/architecture/P1-02-tanstack-vercel-guidance.md` only | 2026-08-29 | 2026-08-29 | Verified against current official TanStack/Vercel sources after Nitro v3 correction; version policy and deployment integration are recorded. |
| P1-03 | Done | P1-02 | Recovery: `p1_03_scaffold_recovery` (original worker usage-limited) | Application scaffold and `docs/architecture/P1-03-scaffold-evidence.md` | 2026-08-29 | 2026-08-29 | Verified React/TypeScript/Vite/Nitro scaffold, exact installed versions, successful production build and HTTP 200 dev response, stopped process, preserved planning files, and removed only the temporary scaffold copy. |
| P1-04 | Done | P1-03 | `p1_04_core_dependencies` | Dependency manifests/lockfile, dependency-specific config, minimal existing provider/style files, P1-04 evidence | 2026-08-29 | 2026-08-29 | Verified direct dependency tree, SSR Query/Tailwind wiring, no-emit TypeScript, and production build. Four moderate findings are confined to Drizzle Kit's dev-only deprecated loader; only a breaking forced downgrade is offered and was not applied. |
| P1-05 | Done | P1-03 | `p1_05_typescript_lint_format` | TypeScript/lint/format configs, package scripts/lockfile, scoped mechanical formatting, P1-05 evidence | 2026-08-29 | 2026-08-29 | Verified strict/no-emit TypeScript, scoped ESLint/Prettier scripts, type-check, lint, format check, and production build. |
| P1-06 | Done | P1-04 | `p1_06_environment_validation` | New `src/lib` environment modules and P1-06 evidence | 2026-08-29 | 2026-08-29 | Verified clear aggregated validation, server-only import boundary, clean repository checks/build, and fake-canary public bundle scan with no server secret identifiers/values. |
| P1-07 | Ready | P1-06 | Unassigned | `.env.example` and secret-handling documentation only | — | — | Dependency verified; queued behind current critical-path capacity. |
| P1-09 | Done | P1-04 | `p1_09_test_runners` | Test scripts/config/setup/sample tests, package manifest/lock, P1-09 evidence | 2026-08-29 | 2026-08-29 | Independently verified type/lint/format, unit 1/1, component 1/1, Chromium E2E 1/1, and production build. |
| P1-10 | Done | P1-05, P1-09 | Recovery: `p1_10_ci_recovery` (original worker usage-limited) | `.github` CI workflow and P1-10 evidence only | 2026-08-29 | 2026-08-30 | Recovery audit preserved the existing workflow; verified YAML/security assertions, `npm ci`, type-check, lint, unit 1/1, component 1/1, and production build. |
| P1-11 | Ready | P1-06, P1-10 | Unassigned | Vercel Preview configuration/deployment evidence | — | — | Dependencies verified; execution may require owner-linked Vercel access and non-production environment values. |
| P2-01 | Done | P1-04 | `p2_01_design_tokens` | `src/styles.css`, root font metadata only, and P2-01 evidence | 2026-08-29 | 2026-08-29 | Verified exact brand/status/supporting tokens, Oswald/Inter loading with fallbacks, Tailwind utility mapping, clean checks, and build. |
| P2-02 | Paused | P2-01 | `p2_02_ui_primitives` (interrupted) | Shared UI primitive components/styles and focused component tests/evidence | 2026-08-30 | — | Agent stopped by owner; partial unverified work is preserved. |
| P3-01 | Done | P1-06 | `p3_01_database_connection` | New server-only DB connection module and P3-01 evidence only | 2026-08-29 | 2026-08-29 | Verified server-only lazy singleton, `prepare:false`, pool size/lifecycle, fake no-query probe, clean gates/build, and explicit live Supabase prerequisite. |
| P3-02 | Done | P3-01 | Recovery: `p3_02_migrations_recovery` (original worker usage-limited) | Drizzle config/scripts/tooling boundaries and P3-02 evidence only | 2026-08-29 | 2026-08-30 | Preserved existing tooling; verified offline generate/check, disposable PostgreSQL SQL-generation smoke, type-check, lint, and format check with no live DB or domain schema work. |
| P3-03 | Paused | P3-02 | `p3_03_shared_enums` (interrupted) | Shared enum/audit schema modules, focused validation, and P3-03 evidence only | 2026-08-30 | — | Agent stopped by owner; partial unverified work is preserved. |
| P1-08 | Done | P1-03 | `p1_08_directory_structure` | New directory-boundary `.gitkeep` files and `docs/architecture/P1-08-project-structure.md` only | 2026-08-29 | 2026-08-29 | Verified 21 required route/component/db/server/lib/styles/test boundaries, ownership/import-direction documentation, and no edits to existing scaffold files within this worker's scope. |
| P7-01 | Blocked | — | Requirements owner | Decision register / storage-policy documentation | — | — | Owner confirmation is required; private/authenticated storage remains the documented default. |

### Initial dispatch — approved

Available ready work should be dispatched in dependency order and up to the live-agent limit:

1. `P0-02` — dispatched to `p0_02_source_availability`.
2. `P1-02` — dispatched to `p1_02_stack_guidance`.
3. `P1-01` — dispatched to `p1_01_repository_init` after P0-02 was verified `Done`.

`P0-01`, `P0-05`, and `P7-01` remain externally blocked. When `P1-02` is verified `Done`, `P1-03` becomes dependency-ready.

## Milestone tracker

| Phase | Scope | Status | Done | Total | Exit gate |
|---|---|---|---:|---:|---|
| 0 | Source-of-truth capture | In Progress | 1 | 8 | Feature-parity matrix is complete. |
| 1 | Repository and foundation | In Progress | 9 | 11 | Build, tests, CI, and Preview deployment work. |
| 2 | Design system and shell | In Progress | 1 | 8 | Admin and Player mobile shells pass baseline review. |
| 3 | Database and migrations | In Progress | 2 | 11 | Clean database is reproducible and constraints are tested. |
| 4 | Authentication and authorization | Not Started | 0 | 9 | Admin/Player sessions and server ownership tests pass. |
| 5 | Core club management | Not Started | 0 | 19 | Roster, attendance, statistics, and request lifecycles pass. |
| 6 | Dashboards and shared features | Not Started | 0 | 12 | All non-media tabs and role restrictions pass. |
| 7 | Media and storage | Not Started | 0 | 9 | Gallery and voice workflows pass with no Base64 database storage. |
| 8 | Legacy migration | Not Started | 0 | 7 | Non-production rehearsal and reconciliation pass. |
| 9 | Quality and acceptance | Not Started | 0 | 8 | Security, E2E, mobile, and parity acceptance pass. |
| 10 | Deployment and cutover | Not Started | 0 | 10 | Production smoke tests and owner acceptance pass. |

## Current sprint / work queue

| Priority | Task | Status | Owner | Started | Target/Completed | Notes |
|---:|---|---|---|---|---|---|
| 1 | P0-02 — Obtain current application source | Done | `p0_02_source_availability` | 2026-08-29 | 2026-08-29 | Unavailability report verified at `docs/source-audit/P0-02-current-source-availability.md`. |
| 2 | P1-02 — Verify current stack/deployment guidance | Done | `p1_02_stack_guidance` | 2026-08-29 | 2026-08-29 | Corrected guidance verified against current official TanStack and Vercel sources. |
| 3 | P1-01 — Initialize repository | Done | `p1_01_repository_init` | 2026-08-29 | 2026-08-29 | Repository state, branch, ownership, ignore rules, and workflow documentation verified. |
| 4 | P1-03 — Scaffold TanStack Start | Done | `p1_03_scaffold_recovery` | 2026-08-29 | 2026-08-29 | Build and dev response verified; temporary scaffold removed. |
| 5 | P1-04 — Install/configure core dependencies | Done | `p1_04_core_dependencies` | 2026-08-29 | 2026-08-29 | Dependency tree, type-check, runtime integration, audit disposition, and build verified. |
| 6 | P1-08 — Establish application directory structure | Done | `p1_08_directory_structure` | 2026-08-29 | 2026-08-29 | All required boundaries and structure documentation verified. |
| 7 | P1-05 — Strict TypeScript, lint, formatting | Done | `p1_05_typescript_lint_format` | 2026-08-29 | 2026-08-29 | Type-check, lint, format check, and production build independently verified. |
| 8 | P1-06 — Environment validation | Done | `p1_06_environment_validation` | 2026-08-29 | 2026-08-29 | Server/public validation and client-bundle secrecy independently verified. |
| 9 | P2-01 — Design tokens | Done | `p2_01_design_tokens` | 2026-08-29 | 2026-08-29 | Token values/utilities, font metadata, checks, and build verified. |
| 10 | P1-09 — Test runners | Done | `p1_09_test_runners` | 2026-08-29 | 2026-08-29 | All sample suites and repository/build checks independently verified. |
| 11 | P3-01 — Supabase PostgreSQL pooler connection | Done | `p3_01_database_connection` | 2026-08-29 | 2026-08-29 | Pooler-safe lazy configuration and no-query evidence verified; live credential prerequisite recorded. |
| 12 | P1-07 — Env example/secret docs | Ready | Unassigned | — | — | Queued by capacity. |
| 13 | P2-02 — Shared UI primitives | Paused | `p2_02_ui_primitives` (interrupted) | 2026-08-30 | — | Partial unverified work preserved; no agent is active. |
| 14 | P1-10 — Continuous integration | Done | `p1_10_ci_recovery` | 2026-08-29 | 2026-08-30 | Existing workflow recovered and independently verified without rework. |
| 15 | P3-02 — Drizzle migration generation | Done | `p3_02_migrations_recovery` | 2026-08-29 | 2026-08-30 | Existing tooling recovered and verified without domain schema/live DB work. |
| 16 | P1-11 — Initial Vercel Preview deployment | Ready | Unassigned | — | — | Dependencies are complete; queued behind higher-value local work and may require linked Vercel access. |
| 17 | P3-03 — Shared enums and audit conventions | Paused | `p3_03_shared_enums` (interrupted) | 2026-08-30 | — | Partial unverified work preserved; no agent is active. |
| 4 | P0-01 — Obtain Complete System Specification | Blocked | Unassigned | — | — | Required artifact is absent; owner must supply or link it. |
| 5 | P0-05 — Export legacy data and gallery | Blocked | Unassigned | — | — | Required legacy values/export are absent; owner must supply them or access. |
| 6 | P7-01 — Decide Storage privacy model | Blocked | Requirements owner | — | — | Owner decision needed before Storage configuration/production; private is the safe default. |

## Decision register

| ID | Decision | Status | Needed by | Current default | Resolution/date |
|---|---|---|---|---|---|
| D-01 | Fourth monthly leave request: block or warn? | Open | P5-12 | Observe live behavior; otherwise ask owner. | — |
| D-02 | Retain `legacy_pin` after migration? | Open | P3-04 / P8-02 | Retain only if needed for migration history; never use for login. | — |
| D-03 | Private or public Storage buckets? | Resolved | P7-01 | Public read for team feed/voice with server-side Admin mutation authorization. | 2026-08-30 |
| D-04 | Final production Admin credentials | Open | P10-04 | Provision securely at cutover. | — |
| D-05 | Canonical gallery set | Open | P8-03 | Preserve exported source until owner selects. | — |
| D-06 | Final crest/logo | Open | P2-03 / P10-04 | Preserve current interim branding. | — |

## Risks and blockers

| ID | Risk/blocker | Impact | Mitigation | State |
|---|---|---|---|---|
| R-01 | Complete System Specification is absent | High fidelity risk | Obtain it before finalizing feature parity and acceptance. | Open |
| R-02 | Current application source/live behavior is unavailable | Business-rule ambiguity | Record assumptions and request owner decisions only when encountered. | Open |
| R-03 | Legacy export is unavailable or malformed | Data migration may be incomplete | Preserve raw export, validate before writes, and produce reconciliation reports. | Open |
| R-04 | Passwordless Player selection cannot prove identity | Known product security limitation | Bind all subsequent access to a secure server session and keep private data self-only. | Accepted by specification |
| R-05 | TanStack Start deployment APIs may change | Build/deployment risk | Recheck stable official guidance before scaffold and production release. | Monitoring |
| R-06 | Rapid attendance taps can race | Incorrect persisted status | Use ordered mutations/versioning and revalidation tests. | Planned |
| R-07 | Media operations span Storage and PostgreSQL | Orphaned objects or metadata | Use staged operations, compensating cleanup, and failure-path tests. | Planned |
| R-08 | Preview deployments could touch Production | Production data corruption | Isolate environments and prohibit Production credentials in Preview. | Planned |
| R-09 | Parallel agents share one working tree | Conflicting or overwritten edits | Assign non-overlapping write scopes and sequence tasks that touch the same files. | Active control |

## Definition-of-Done checklist

- [ ] Admin workflows match the approved product behavior.
- [ ] Player workflows match the approved product behavior.
- [ ] Somali-first mobile UI remains familiar.
- [ ] Player login remains name-selection based without password/PIN.
- [ ] Attendance remains Admin-authoritative with immediate status persistence.
- [ ] PostgreSQL stores all relational persistent data.
- [ ] Drizzle owns schema changes through committed migrations.
- [ ] Better Auth owns secure authentication and sessions.
- [ ] Server-side role and ownership checks protect every private operation.
- [ ] Gallery and voice media use Supabase Storage.
- [ ] Failed reads and writes have visible, recoverable Somali states.
- [ ] Required unit, integration, component, and E2E tests pass.
- [ ] Vercel Preview and Production deployments pass smoke tests.
- [ ] Legacy migration reconciliation passes.
- [ ] Secrets are configured safely and do not reach browser bundles or logs.
- [ ] No unapproved behavior or non-goal was introduced.
- [ ] Owner acceptance is recorded.

## Update log

| Date | Update | Related tasks |
|---|---|---|
| 2026-08-29 | Created implementation backlog and initial tracker from the approved rebuild plan. | All |
| 2026-08-29 | Added orchestration controls, parallel task ledger, dependency-ready queue, and explicit external blockers after auditing all project source documents and workspace contents. No implementation task was dispatched pending parent acknowledgement. | P0-01, P0-02, P0-05, P1-01, P1-02, P7-01 |
| 2026-08-29 | Parent acknowledged the initial queue. Dispatched P0-02 and P1-02 in parallel with non-overlapping, single-deliverable scopes; P1-01 remains next for available capacity after verification. | P0-02, P1-02, P1-01 |
| 2026-08-29 | Verified P0-02 `Done`: the source-availability report accurately records that no application source, repository/archive, source pointer, or live-app URL is present; task scope was respected. | P0-02 |
| 2026-08-29 | Dispatched P1-01 to a dedicated repository-initialization worker after P0-02 verification, with a non-overlapping write scope alongside P1-02. | P1-01 |
| 2026-08-29 | Moved P1-02 to `In Review`; source verification confirmed most guidance but identified a Nitro v2/v3 policy conflict. Returned the single deliverable to its worker for correction before completion. | P1-02 |
| 2026-08-29 | Verified P1-01 `Done`: repository is an empty Git worktree on `main`, ignore behavior and workflow documentation pass, and the sandbox-owned empty `.git` was safely reinitialized under the workspace owner after causing tooling refresh failures. | P1-01 |
| 2026-08-29 | Verified P1-02 `Done` after the worker corrected Nitro guidance to the current official v3 `nitro/vite` integration; P1-03 is now dependency-ready. | P1-02, P1-03 |
| 2026-08-29 | Dispatched P1-03 to a fresh scaffold worker with exclusive application-file scope; P1-04, P1-05, and P1-08 remain dependency-blocked. | P1-03 |
| 2026-08-29 | Resumed after P1-03 worker usage-limit interruption. Inspected the partial scaffold, confirmed resolved versions and preserved planning files, and independently reran a successful production build. Recorded remaining cleanup/evidence/dev-check work without redoing the scaffold. | P1-03 |
| 2026-08-29 | Dispatched a fresh P1-03 recovery worker with a bounded no-redo scope: verify dev HTTP response, correct lockfile evidence wording, and remove only the confirmed temporary scaffold directory. | P1-03 |
| 2026-08-29 | Verified P1-03 `Done`: production build and live dev HTTP response pass, versions match the reviewed policy, planning files are preserved, and interrupted-worker temporary artifacts are removed. Unlocked P1-04, P1-05, and P1-08. | P1-03, P1-04, P1-05, P1-08 |
| 2026-08-29 | Dispatched P1-04 and P1-08 in parallel with non-overlapping scopes; P1-05 remains sequenced behind P1-04 because both require package-manifest changes. | P1-04, P1-08, P1-05 |
| 2026-08-29 | Verified P1-08 `Done`: 21 directory boundaries and the ownership/dependency map are present; existing scaffold files remained untouched by the structure worker. | P1-08 |
| 2026-08-29 | Verified P1-04 `Done`: all required dependencies resolve, SSR Query and Tailwind are configured, TypeScript/build pass, and the documented moderate advisories are dev-tool-only with no safe non-breaking automatic fix. Unlocked P1-06, P1-09, and P2-01. | P1-04, P1-06, P1-09, P2-01 |
| 2026-08-29 | Dispatched P1-05 alone with exclusive global TypeScript/lint/format/package scope; P1-06, P1-09, and P2-01 remain ready but sequenced to prevent concurrent config/source rewrites. | P1-05 |
| 2026-08-29 | Verified P1-05 `Done`: strict TypeScript and scoped lint/format scripts pass alongside the production build. P1-06, P1-09, and P2-01 are dependency-ready. | P1-05, P1-06, P1-09, P2-01 |
| 2026-08-29 | Dispatched P1-06 and P2-01 in parallel with non-overlapping environment-module and style-token scopes; P1-09 remains next for capacity. | P1-06, P2-01, P1-09 |
| 2026-08-29 | Verified P1-06 `Done`: typed public/server validation, server-only import protection, repository checks, build, and canary bundle scan pass. Unlocked P1-07 and P3-01. | P1-06, P1-07, P3-01 |
| 2026-08-29 | Verified P2-01 `Done`: required palette, typography, layout/spacing variables, Tailwind utilities, and font loading pass checks/build. Unlocked P2-02. | P2-01, P2-02 |
| 2026-08-29 | Dispatched P1-09 and P3-01 in parallel with isolated test-runner and database-connection scopes; P1-07/P2-02 remain next by capacity. | P1-09, P3-01, P1-07, P2-02 |
| 2026-08-29 | Verified P1-09 `Done`: unit/component/E2E sample suites and all repository/build gates pass; unlocked P1-10. | P1-09, P1-10 |
| 2026-08-29 | Verified P3-01 `Done`: pooler-safe lazy database configuration passes no-query/static/build checks and records the missing live Supabase prerequisite; unlocked P3-02. | P3-01, P3-02 |
| 2026-08-29 | Dispatched P1-10 and P3-02 in parallel with isolated CI-workflow and migration-tooling scopes; P1-07/P2-02 remain queued by capacity. | P1-10, P3-02, P1-07, P2-02 |
| 2026-08-30 | Recovered and verified P1-10 `Done` without redoing the interrupted work: workflow structure/security assertions, clean install, type-check, lint, unit/component tests, and production build pass. This unlocks P1-11. | P1-10, P1-11 |
| 2026-08-30 | Dispatched P2-02 to a dedicated worker with isolated shared-component/test scope while the P3-02 recovery audit continues. | P2-02, P3-02 |
| 2026-08-30 | Recovered and verified P3-02 `Done` without redoing the interrupted work: offline migration generation/check and a disposable PostgreSQL schema-to-SQL smoke pass; repository quality gates pass and no live database was touched. | P3-02 |
| 2026-08-30 | Dispatched P3-03 to a dedicated worker with isolated enum/audit-convention scope after P3-02 verification. | P3-03 |

## Tracker update procedure

When starting work:

1. Confirm every declared dependency is `Done` and the proposed write scope does not overlap another active worker.
2. Set the task to `In Progress` in the task execution ledger and current work queue.
3. Add it to `Active tasks` in Overall status.
4. Record the dedicated agent/task context, start date, and intended write scope.
5. Update its phase to `In Progress`.

When finishing work:

1. Move the worker result to `In Review`; do not accept a worker's completion claim by itself.
2. Confirm the acceptance criteria in `IMPLEMENTATION_TASKS.md`, inspect deliverables/diffs, and validate relevant test/build evidence.
3. Dispatch an independent verification agent if completion cannot be established through read-only inspection and standard validation commands.
4. Only then mark the task `Done` and record the verified completion date.
5. Increment the phase and overall completed counts, remove it from `Active tasks`, and enqueue newly unblocked dependents.
6. Add a concise update-log entry with validation evidence.

When blocked:

1. Mark the task `Blocked`.
2. Add or update an entry in Risks and blockers.
3. Record the exact missing decision, dependency, or external state.
4. Continue with independent tasks when safe.
