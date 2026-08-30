# P3-02 — Drizzle migration generation

## Decision

Drizzle Kit is configured for PostgreSQL with one canonical schema entry point and one committed migration output directory:

| Setting | Value |
|---|---|
| Dialect | `postgresql` |
| Schema | `src/db/schema/index.ts` |
| Output | `drizzle/` |
| Strict prompts | Enabled |
| Verbose SQL | Enabled |

`src/db/schema/index.ts` is currently an empty discovery marker. P3-03 and the later table tasks own domain definitions. P3-09 owns the first real application migration, after the complete initial schema can be reviewed as a unit.

## Commands

```text
npm run db:generate
npm run db:check
```

`db:generate` compares the TypeScript schema with Drizzle's local migration snapshots and writes SQL plus metadata into `drizzle/`. The generated SQL and metadata are source-controlled application artifacts and must be reviewed together.

`db:check` checks the consistency of the committed migration history. It does not inspect or mutate a live database.

No `push`, `migrate`, or destructive reset script is provided. Applying reviewed migrations to an environment belongs to deployment work with an explicit target and credential.

## Credential boundary

`drizzle.config.ts` runs in Node and reads only the server-side `DATABASE_URL` environment variable. It never reads a `VITE_` variable, imports browser environment code, logs the value, or embeds a fallback credential. The URL is optional for the offline `generate` and `check` workflows; when present it is passed to Drizzle Kit for a future command that explicitly needs database access.

Application queries continue to use the lazy, pooler-safe client in `src/db/connection.server.ts`. Drizzle Kit does not import that runtime module and does not change its `prepare: false` policy.

## Safe workflow

1. Add or change schema definitions under `src/db/schema/` and re-export them from the canonical entry point.
2. Set a syntactically valid server-only `DATABASE_URL` if the selected Drizzle command requires it.
3. Run `npm run db:generate`.
4. Review every generated SQL statement and the matching `drizzle/meta` snapshot.
5. Run `npm run db:check` and repository quality gates.
6. Commit the schema source, SQL, and metadata together.

Production schema changes are migration-driven. Developers must not use dashboard edits or `drizzle-kit push` as a substitute for reviewed SQL migrations.

## Offline validation scope

P3-02 is validated without a live Supabase project. A syntactically valid fake PostgreSQL URL may be supplied to prove config loading, generation, and checking without a query. A temporary, non-domain smoke schema and temporary output directory can additionally prove that the configured PostgreSQL generator emits SQL; those temporary artifacts must not be committed.

An empty canonical schema correctly produces no application migration. This task therefore does not claim a live connection, an applied migration, or a reproducible application schema. Those claims remain blocked on P3-03 through P3-09.

The offline generation initializes `drizzle/meta/_journal.json` with an empty entry list. This is migration-tool metadata, not an application migration, and is committed as the starting history boundary.
