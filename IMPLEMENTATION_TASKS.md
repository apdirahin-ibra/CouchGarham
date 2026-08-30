# BEST OFFICIAL APP — Implementation Task List

This backlog translates `BEST_OFFICIAL_APP_REBUILD_SPEC.md` into executable work. Task IDs are stable and are referenced by `PROJECT_TRACKER.md`.

## Status values

- `Not Started`
- `In Progress`
- `Blocked`
- `In Review`
- `Done`

## Completion rules

A task is `Done` only when its implementation, validation, authorization checks, relevant tests, and documentation are complete. Product behavior must not change without owner approval.

## Phase 0 — Source-of-truth capture

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P0-01 | Obtain the 17-page Complete System Specification | — | Document is stored or linked and its requirements are incorporated into the parity matrix. |
| P0-02 | Obtain current application source | — | Source is available for read-only behavior and data-model inspection, or its unavailability is recorded. |
| P0-03 | Inspect and record current Admin workflows | P0-01 | Every Admin tab and critical interaction has written expected behavior. |
| P0-04 | Inspect and record current Player workflows | P0-01 | Every Player tab and critical interaction has written expected behavior. |
| P0-05 | Export legacy `club-data` and `club-gallery` | — | Original exports are preserved unchanged in a secure migration-input location. |
| P0-06 | Collect canonical content and branding | P0-01 | Somali labels, Waano, rules, announcements, schedule, gallery, and logo sources are identified. |
| P0-07 | Resolve or record observable behavior details | P0-03, P0-04 | Leave limit, recent history, login cap, excuses, join defaults, and gallery behavior are documented. |
| P0-08 | Create feature-parity matrix | P0-03, P0-04 | Each existing feature maps to a route, server operation, test, and acceptance criterion. |

## Phase 1 — Repository and foundation

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P1-01 | Initialize Git repository and baseline commit workflow | — | Repository is initialized with an appropriate `.gitignore` and documented branch conventions. |
| P1-02 | Verify current TanStack Start and Vercel guidance | — | Stable supported versions and deployment adapter are recorded before scaffolding. |
| P1-03 | Scaffold TanStack Start with React, TypeScript, and Vite | P1-02 | Development server and production build run successfully. |
| P1-04 | Install and configure core dependencies | P1-03 | Router, Query, Tailwind, Zod, Drizzle, Better Auth, Supabase, icons, and test dependencies are configured. |
| P1-05 | Configure strict TypeScript, linting, and formatting | P1-03 | Type-check, lint, and formatting checks run from package scripts. |
| P1-06 | Define server-only and public environment validation | P1-04 | Missing variables fail clearly and secrets cannot enter the client bundle. |
| P1-07 | Add `.env.example` and secret-handling documentation | P1-06 | All required variables are documented without containing secrets. |
| P1-08 | Establish application directory structure | P1-03 | Routes, components, database, server, library, styles, and tests have clear boundaries. |
| P1-09 | Configure Vitest, React Testing Library, and Playwright | P1-04 | Sample unit, component, and E2E tests execute successfully. |
| P1-10 | Configure continuous integration checks | P1-05, P1-09 | CI runs type-check, lint, unit tests, and production build. |
| P1-11 | Create initial Vercel Preview deployment | P1-06, P1-10 | Preview loads successfully and uses non-production configuration. |

## Phase 2 — Design system and application shell

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P2-01 | Implement color, spacing, typography, and layout tokens | P1-04 | Pitch, gold, chalk, status colors, Oswald, and Inter are consistently available. |
| P2-02 | Build shared UI primitives | P2-01 | Cards, titles, stats, fields, buttons, badges, dialogs, toasts, and states are reusable and accessible. |
| P2-03 | Build top application bar | P2-02 | Branding, role/player identity, and logout regions work at mobile widths. |
| P2-04 | Build fixed bottom navigation | P2-02 | Tabs scroll horizontally, show icon and Somali label, and highlight active state in gold. |
| P2-05 | Build Admin application shell | P2-03, P2-04 | All approved Admin tab destinations are represented without desktop-dashboard redesign. |
| P2-06 | Build Player application shell | P2-03, P2-04 | All approved Player tab destinations are represented. |
| P2-07 | Add Somali loading, empty, error, and retry patterns | P2-02 | All route states have understandable user-facing feedback. |
| P2-08 | Validate responsive and accessibility baseline | P2-05, P2-06, P2-07 | Keyboard, focus, contrast, touch targets, and target mobile layouts pass review. |

## Phase 3 — Database and migrations

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P3-01 | Configure Supabase PostgreSQL pooler connection | P1-06 | Server connection uses the pooler and disables prepared statements where required. |
| P3-02 | Configure Drizzle and migration generation | P3-01 | Schema changes generate committed SQL migrations. |
| P3-03 | Define shared enums and audit conventions | P3-02 | Role, attendance, request status, finance type, and origin values are constrained. |
| P3-04 | Define Player and monthly-statistics tables | P3-03 | Required fields, unique month constraint, foreign keys, and indexes are present. |
| P3-05 | Define attendance and excuse tables | P3-04 | One attendance row per player/date and valid excuse relationships are enforced. |
| P3-06 | Define leave, excuse-request, and join-request tables | P3-04 | Status, reviewer, origin, and audit fields support required workflows. |
| P3-07 | Define suggestions, finance, tips, and chat tables | P3-04 | Ownership, decimal finance values, display snapshots, and ordering are supported. |
| P3-08 | Define login-log, schedule, gallery, and settings tables | P3-04 | Login cap support, recurring weekdays, media metadata, and singleton settings are supported. |
| P3-09 | Generate and review initial migration | P3-05, P3-06, P3-07, P3-08 | A clean database is reproducibly created from committed migrations. |
| P3-10 | Add idempotent base seed process | P3-09, P0-06 | Required base content can be seeded repeatedly without duplication. |
| P3-11 | Add schema and constraint tests | P3-09 | Invalid enums, duplicates, and broken ownership relationships are rejected. |

## Phase 4 — Authentication and authorization

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P4-01 | Configure Better Auth with Drizzle | P3-09 | Auth tables, secure cookies, and server integration work. |
| P4-02 | Implement secure Admin provisioning | P4-01 | A single Admin can be created/reset without plaintext credential storage. |
| P4-03 | Implement Admin username/password login | P4-02 | Valid login creates a secure session; invalid credentials reveal no sensitive detail. |
| P4-04 | Implement minimal active-Player login list | P3-04 | Public response exposes only information required for name selection. |
| P4-05 | Implement passwordless Player session flow | P4-01, P4-04 | Selecting an active Player creates a server-recognized session bound to that Player. |
| P4-06 | Implement authorization helpers | P4-03, P4-05 | `requireSession`, `requireAdmin`, `requirePlayer`, and ownership checks are reusable. |
| P4-07 | Add role route guards and logout | P4-06, P2-05, P2-06 | Unauthorized routes redirect safely and logout invalidates the session. |
| P4-08 | Implement successful-login logging and cap | P4-06, P3-08 | Successful logins are recorded and retained according to the 200-entry rule. |
| P4-09 | Add authentication and authorization integration tests | P4-07, P4-08 | Cross-role and cross-Player access attempts fail on the server. |

## Phase 5 — Core club management

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P5-01 | Implement Admin roster list and Player creation | P4-06, P3-04 | Valid Players can be added and appear in Admin roster and login selection. |
| P5-02 | Implement Player editing and deactivation | P5-01 | Profile changes persist and deactivation preserves historical records. |
| P5-03 | Implement Admin Player detail view | P5-02 | Profile, attendance, leave, excuses, and monthly statistics are accessible. |
| P5-04 | Implement attendance date and roster query | P5-02, P3-05 | Selected date returns active roster and existing statuses efficiently. |
| P5-05 | Implement immediate attendance status upsert | P5-04 | Every status tap persists immediately with visible saving/success/failure state. |
| P5-06 | Implement attendance excuse editing | P5-05 | Reasons persist for Maqan/Daahay and do not create invalid Xadir excuses. |
| P5-07 | Implement secondary `Keydi Dhammaan` action | P5-05, P5-06 | Full visible roster can be safely re-saved without replacing immediate persistence. |
| P5-08 | Protect attendance against rapid stale responses | P5-05 | Older responses cannot overwrite a newer status selection. |
| P5-09 | Implement current-month statistics read and Admin edit | P5-03, P3-04 | Goals, assists, errors, and derived attendance counts are month-scoped. |
| P5-10 | Implement Player personal attendance and statistics views | P5-06, P5-09 | Session Player sees only their own private history and current-month stats. |
| P5-11 | Implement Player excuse submission and history | P5-10, P3-06 | Request is created as the session Player with pending/approved/denied history. |
| P5-12 | Implement Player leave submission and history | P5-10, P3-06 | Date, reason, statuses, monthly count, and confirmed limit behavior are preserved. |
| P5-13 | Implement Admin direct approved leave | P5-03, P3-06 | Admin-created leave is immediately approved and visible to the Player. |
| P5-14 | Implement public join request submission | P3-06 | Name, phone, and message create a validated pending request. |
| P5-15 | Implement unified Admin request inbox | P5-11, P5-12, P5-14 | Join, excuse, and leave requests are grouped and reviewable. |
| P5-16 | Implement transactional excuse approval/denial | P5-15 | Approval also writes permanent excuse atomically; repeated review is safe. |
| P5-17 | Implement transactional leave approval/denial | P5-15 | Status and reviewer fields update atomically and Player history reflects the result. |
| P5-18 | Implement transactional join approval/denial | P5-15 | Approval creates exactly one Player and cannot duplicate on retry. |
| P5-19 | Add core workflow integration and E2E tests | P5-18 | Admin and Player core flows, ownership rules, persistence, and failure handling pass. |

## Phase 6 — Dashboards and shared features

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P6-01 | Implement Admin dashboard | P5-19 | Date, logins, expandable attendance, excuses, monthly totals, and pending alert match requirements. |
| P6-02 | Implement Player dashboard | P5-10, P5-12 | Announcement, personal monthly stats, voice placeholder, and leave-used count render correctly. |
| P6-03 | Implement schedule Admin CRUD and Player read view | P4-06, P3-08 | Day, free-text time, and place persist with proper role restrictions. |
| P6-04 | Implement latest matching weekday attendance lookup | P6-03, P5-06 | Somali weekday maps correctly and the latest matching attendance date is grouped by status. |
| P6-05 | Implement finance Admin CRUD and totals | P4-06, P3-07 | Income, expense, notes, dates, and decimal-safe totals persist. |
| P6-06 | Implement Player read-only finance view | P6-05 | Player can read finances but cannot mutate them. |
| P6-07 | Implement Waano Admin management and Player view | P4-06, P3-07 | Admin can add/delete and Players can read canonical ordered tips. |
| P6-08 | Implement Player suggestions and private history | P4-06, P3-07 | Submission author comes from session and Player reads only their own history. |
| P6-09 | Implement shared Team Chat | P4-06, P3-07 | Authenticated users post under server-controlled identity and read bounded/paginated history. |
| P6-10 | Implement WhatsApp directory and normalization | P6-09 | Permitted directory renders working `wa.me` links with non-digits removed. |
| P6-11 | Implement rules and text announcement editing/views | P4-06, P3-08 | Admin edits persist; Players have read-only access. |
| P6-12 | Add shared-feature integration and E2E tests | P6-04, P6-06, P6-07, P6-08, P6-10, P6-11 | Role rules, calculations, recurrence behavior, and major flows pass. |

## Phase 7 — Media and storage

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P7-01 | Decide and document Storage privacy model | — | Owner confirms private/authenticated or public media access before production. |
| P7-02 | Configure `club-gallery` and `club-audio` buckets | P7-01, P1-06 | Policies permit Admin writes and approved club-user reads only as decided. |
| P7-03 | Implement gallery image validation and optimization | P7-02 | Supported images are size/type validated and compressed near the approved target. |
| P7-04 | Implement Admin gallery upload | P7-03, P3-08 | Successful object upload creates metadata; partial failure is recoverable. |
| P7-05 | Implement gallery grid, captions, and lightbox | P7-04 | Admin and Player can view the gallery with the preserved interaction model. |
| P7-06 | Implement authorized gallery deletion | P7-04 | Admin deletion handles both object and metadata failures without false success. |
| P7-07 | Implement voice recording capability and fallbacks | P7-02 | MediaRecorder support and microphone denial are handled without breaking text announcements. |
| P7-08 | Implement voice upload, replacement, and playback | P7-07, P6-11 | New audio becomes active only after upload succeeds and old objects are safely cleaned up. |
| P7-09 | Add media authorization and E2E tests | P7-06, P7-08 | Player writes fail, valid reads work, and upload/delete/replace failure paths pass. |

## Phase 8 — Legacy migration

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P8-01 | Define and validate legacy import schema | P0-05, P3-09 | Invalid legacy data produces a report without changing the database. |
| P8-02 | Implement deterministic domain-data import | P8-01 | Players and dependent records import in dependency order with stable mappings. |
| P8-03 | Implement legacy gallery/audio extraction and upload | P8-01, P7-09 | Valid Base64 media becomes Storage objects with database metadata. |
| P8-04 | Implement migration ledger or idempotent reruns | P8-02, P8-03 | Rerunning cannot silently duplicate imported records or media. |
| P8-05 | Implement reconciliation report | P8-04 | Counts, statuses, totals, content, captions, and audio are compared with source data. |
| P8-06 | Rehearse full migration in non-production | P8-05 | Import completes, reconciliation passes, and runtime workflows work against migrated data. |
| P8-07 | Document production migration and rollback procedure | P8-06 | Cutover steps, evidence, backups, ownership, and recovery actions are explicit. |

## Phase 9 — Quality, security, and acceptance

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P9-01 | Complete required unit-test suite | P6-12 | Dates, weekdays, finance, attendance, leave logic, WhatsApp, and authorization pass. |
| P9-02 | Complete component tests | P7-09 | Forms, navigation, validation, states, and attendance interaction pass. |
| P9-03 | Complete Admin E2E suite | P7-09 | All twelve Admin critical flows in the specification pass. |
| P9-04 | Complete Player E2E suite | P7-09 | All eleven Player critical flows in the specification pass. |
| P9-05 | Perform server authorization/security review | P9-03, P9-04 | Direct forbidden calls, cross-Player access, invalid input, and inactive login are rejected. |
| P9-06 | Verify secrets and sensitive logging | P9-05 | Browser bundles and logs contain no database URL, service key, password, or session secret. |
| P9-07 | Perform mobile-browser and accessibility review | P9-03, P9-04 | Target Android/iPhone sizes, larger constrained layout, keyboard, focus, and touch use pass. |
| P9-08 | Execute feature-parity acceptance review | P0-08, P9-07 | Every parity-matrix item is accepted or has explicit owner-approved deviation. |

## Phase 10 — Deployment and cutover

| ID | Task | Depends on | Acceptance criteria |
|---|---|---|---|
| P10-01 | Configure isolated Development, Preview, and Production environments | P1-11 | Preview cannot mutate Production and all variable scopes are documented. |
| P10-02 | Configure production observability and safe error reporting | P9-06 | Operational failures are visible without logging sensitive personal or auth data. |
| P10-03 | Run release-candidate Preview deployment | P9-08, P10-01 | Build, migrations, automated tests, and manual smoke tests pass in Preview. |
| P10-04 | Confirm production decisions and credentials | P7-01, P10-03 | Admin credentials, media policy, branding, and unresolved behavior decisions are recorded. |
| P10-05 | Capture final legacy snapshot and freeze writes | P8-07, P10-04 | Final immutable export is stored and the legacy cutover state is controlled. |
| P10-06 | Apply production migrations and provision Admin | P10-05 | Production schema is current and secure Admin login succeeds. |
| P10-07 | Import and reconcile production legacy data | P10-06 | Reconciliation report passes or exceptions receive owner approval. |
| P10-08 | Deploy production application | P10-07 | Production URL loads with the correct environment and secure sessions. |
| P10-09 | Execute post-deployment Admin and Player smoke tests | P10-08 | Login, attendance persistence, requests, media, and logout pass for both roles. |
| P10-10 | Obtain owner acceptance and close cutover | P10-09 | Definition of Done is met and any retained rollback artifacts are documented. |

## Cross-cutting rules

- Enforce authorization on the server for every protected read and mutation.
- Derive Player ownership from the authenticated session, not browser-supplied IDs.
- Validate every server input.
- Add tests in the same phase as each feature rather than deferring all testing.
- Never show a successful write when persistence failed.
- Do not seed or overwrite production data because a read failed.
- Preserve Somali-first labels and the existing mobile interaction model.
- Do not implement any item listed as a non-goal without explicit approval.

