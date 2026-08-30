# Drizzle migrations

This directory is the committed output of Drizzle Kit migration generation.

- Define schema objects under `src/db/schema/` and export them from `src/db/schema/index.ts`.
- Run `npm run db:generate` after reviewing the schema change.
- Review the generated SQL and metadata before committing both.
- Run `npm run db:check` to verify migration-history consistency.
- Do not use schema push commands or manually edit production tables.

P3-02 intentionally adds no SQL migration. P3-09 owns generation and review of the initial application migration after the domain schema is complete.

`meta/_journal.json` is Drizzle Kit's generated, empty migration-history journal. Keep it committed; later generation appends reviewed migration entries.
