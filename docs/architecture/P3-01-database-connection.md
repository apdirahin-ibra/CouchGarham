# P3-01 — Supabase PostgreSQL pooler connection

## Decision

Application database traffic uses the Supabase PostgreSQL connection pooler
through `DATABASE_URL`. `src/db/connection.server.ts` creates a postgres.js
client and passes it to Drizzle with these application-side settings:

| Option | Value | Reason |
|---|---:|---|
| `prepare` | `false` | Supabase Transaction pool mode does not support prepared statements; this also remains compatible with Session pool mode. |
| `max` | `1` | Limits each warm serverless instance to one client connection while Supabase owns connection fan-out. |
| `idle_timeout` | `20` seconds | Releases an application-side idle connection from an inactive warm instance. |
| `connect_timeout` | `10` seconds | Bounds initial connection attempts. |
| `max_lifetime` | `30` minutes | Periodically rotates long-lived connections in warm instances. |

No connection string is constructed or inspected by this module. Supabase must
provide the complete pooler URL, including the correct pooler host, port,
database, and encoded credentials.

## Lazy server-only lifecycle

- The module has TanStack Start's explicit `server-only` import marker and a
  `.server.ts` suffix.
- Importing the module does not call `getServerEnv()`, instantiate postgres.js,
  or open a network connection.
- `getDatabase()` or `getDatabaseClient()` validates the server environment and
  lazily constructs the client on first use.
- postgres.js itself connects only when a query is executed.
- A `globalThis` symbol stores one client/Drizzle pair per warm runtime. This
  avoids multiplying pools during development module reloads and lets Vercel
  reuse the client between requests.
- `closeDatabaseConnection()` is available for controlled process or test
  teardown. It must not run after every serverless request.

Credentials are never logged or embedded into errors by this module. Existing
environment validation reports variable names, not their values.

## Usage boundary

Server-side query modules should obtain the shared Drizzle instance at operation
time:

```ts
const db = getDatabase()
```

They must not create additional postgres.js clients. Database schemas, queries,
Drizzle Kit configuration, and migrations are intentionally outside P3-01.

## Verification without network I/O

The repository gates can run with no configured secrets because importing and
building the module does not initialize the client:

```text
npm run type-check
npm run lint
npm run format:check
npm run build
```

A focused process-local check may provide fake, syntactically valid environment
values, call `getDatabaseClient()` without executing a query, and inspect
`client.options`. It must confirm `prepare === false`, `max === 1`, singleton
identity across repeated calls, and successful explicit teardown. Constructing
the client and ending it before a query performs no database network I/O.

## External prerequisite for live connectivity

Live verification requires a provisioned Supabase project and its valid
PostgreSQL **pooler** connection URI assigned to server-only `DATABASE_URL` in
the target environment, with the database password correctly URL-encoded and
the runtime permitted to reach the pooler. Use the Transaction pooler URI for
serverless traffic (commonly port `6543`) or the Session pooler URI when that
mode is deliberately selected (commonly port `5432`); copy the authoritative
URI from that Supabase project's Connect panel rather than assuming a host or
port. No such credential is present in this workspace, so P3-01 does not claim
a successful live database connection.
