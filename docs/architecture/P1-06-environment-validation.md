# P1-06 — Environment validation and import boundaries

## Decision

Environment validation is split by runtime and is lazy:

- `src/lib/env.server.ts` reads and validates server configuration only when
  `getServerEnv()` is called. Its `*.server.ts` suffix and explicit
  `@tanstack/react-start/server-only` marker prevent a client import.
- `src/lib/env.client.ts` reads only Vite-public aliases and validates them when
  `getPublicEnv()` is called.
- `src/lib/env.shared.ts` contains the browser-safe schema, types, and error
  formatter. It never reads environment variables.

Lazy access is deliberate. It lets the scaffold type-check and build before
deployment credentials are provisioned, gives a clear error at the operation
that requires configuration, and follows TanStack Start's guidance to avoid
module-scope secret reads.

## Variable boundary

| Server input | Browser input | Classification |
|---|---|---|
| `DATABASE_URL` | — | Server secret |
| `BETTER_AUTH_SECRET` | — | Server secret |
| `BETTER_AUTH_URL` | — | Server-only auth configuration |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Server secret |
| `SUPABASE_URL` | `VITE_SUPABASE_URL` | Public configuration |
| `SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` | Public configuration |
| `VITE_APP_URL` | `VITE_APP_URL` | Public configuration |

The Vite aliases are intentional: Vite only makes `VITE_`-prefixed values
available through `import.meta.env` in browser code. The service-role key and
database/auth secrets have no public alias.

This task does not add the user-facing `.env.example` or the full credential
handling guide; those belong to P1-07.

## Validation behavior

- Required strings reject empty values.
- Database URLs must be valid and use `postgres://` or `postgresql://`.
- Better Auth secrets require at least 32 characters.
- Application, auth, and Supabase URLs must be valid absolute URLs.
- Errors list every invalid variable by name, but never echo its value.

## Verification

Run the normal repository gates without any deployment secrets:

```text
npm run type-check
npm run lint
npm run format:check
npm run build
```

For focused runtime validation, call the accessors with an intentionally empty
environment and confirm the error lists missing names without values; then use
valid process-local canary values and confirm parsing succeeds. Canary values
must never be written to a committed environment file.

After a canary build, scan the generated public assets for the process-local
server secret values. No match is acceptable. This verifies the actual browser
output in addition to relying on the framework boundary.

## Official references

- [TanStack Start: Environment Variables](https://tanstack.com/start/latest/docs/framework/react/guide/environment-variables)
- [TanStack Start: Execution Model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)
- [TanStack Start: Import Protection](https://tanstack.com/start/latest/docs/framework/react/guide/import-protection)
- [Vite: Env Variables and Modes](https://vite.dev/guide/env-and-mode)
