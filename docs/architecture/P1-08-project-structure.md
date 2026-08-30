# P1-08 Project Structure

This structure follows the rebuild specification while leaving the generated TanStack Start scaffold untouched. Directories contain only `.gitkeep` markers until their owning backlog task adds implementation files.

## Ownership map

| Boundary | Purpose and ownership |
| --- | --- |
| `src/routes/` | TanStack Router route modules and route-level composition. Existing generated root and index routes remain authoritative. `admin/` and `player/` separate role-specific route trees. |
| `src/components/ui/` | Domain-neutral visual primitives. Components here must not fetch data or enforce authorization. |
| `src/components/attendance/` | Attendance presentation and interaction components. |
| `src/components/players/` | Roster and Player-detail presentation components. |
| `src/components/gallery/` | Gallery presentation, upload controls, and lightbox components. |
| `src/components/chat/` | Team Chat and WhatsApp-directory presentation components. |
| `src/db/schema/` | Drizzle table, enum, relation, and constraint definitions. This is the canonical persistent-data model. |
| `src/db/queries/` | Reusable database reads and writes. Query modules do not make authorization decisions from client-supplied identity. |
| `src/server/<domain>/` | Server-only use cases grouped by business domain. Initial domains are `players`, `attendance`, `requests`, `finance`, `gallery`, and `schedule`. |
| `src/lib/` | Small shared utilities and infrastructure adapters. Browser-safe and server-only modules must be clearly separated by naming and imports when added. |
| `src/styles/` | Design tokens and shared style layers added beyond the scaffold's existing `src/styles.css`. |
| `tests/unit/` | Pure logic tests without rendering, database, network, or browser dependencies. |
| `tests/component/` | Rendered component behavior and accessibility tests with external boundaries replaced. |
| `tests/integration/` | Cross-boundary server, authorization, database, transaction, and storage tests. |
| `tests/e2e/` | Playwright user journeys through the running application. |

New feature folders should be introduced only by the task implementing that domain. A feature-specific component belongs in `src/components/<domain>/`; its privileged business operations belong in `src/server/<domain>/`.

## Dependency direction

The intended import flow is:

```text
routes -> components -> browser-safe lib
routes -> server use cases -> db queries -> db schema
server use cases -> server-only lib/adapters
tests -> the boundary under test
```

Rules:

1. Route modules coordinate loading, mutations, and screen composition; they do not contain reusable database logic.
2. Components never import `src/db/`, `src/server/`, server-only environment modules, database credentials, or service-role storage clients.
3. `src/components/ui/` stays domain-neutral and cannot depend on domain component folders.
4. Domain components may depend on `ui/` and browser-safe utilities, but not on other domain component folders unless a shared abstraction is first extracted.
5. Server use cases own authentication, authorization, input validation, transaction boundaries, and domain orchestration before calling database or storage adapters.
6. Database query modules depend on schema definitions and database infrastructure; they do not import routes or React components.
7. Schema modules contain persistence definitions only and must not depend on query, server, route, or component modules.
8. `src/lib/` is not a catch-all for feature logic. Code remains in its owning domain unless it is demonstrably shared and dependency-safe.
9. Unit and component tests must not silently replace required integration coverage; ownership and authorization guarantees belong in integration and end-to-end suites.
10. Imports must not bypass role or ownership checks by allowing a browser-controlled Player identifier to become authoritative.

## Boundary notes

- `src/styles.css` remains the scaffold stylesheet. The `src/styles/` directory is reserved for later token and shared-layer work; P1-08 does not move or modify the existing file.
- Generated files such as `src/routeTree.gen.ts` remain generator-owned and must not be edited manually.
- Role route folders express navigation ownership only. Authorization remains mandatory in server operations.
- Migration artifacts and concrete database entry points are intentionally deferred to the database backlog rather than added as placeholders here.
