# P3-03 shared enums and audit conventions

## Scope

P3-03 establishes reusable PostgreSQL/Drizzle primitives only. It intentionally
defines no domain tables and creates no committed migration; domain tables belong
to P3-04 through P3-08, and P3-09 owns the reviewed initial migration.

## PostgreSQL enums

| Export | PostgreSQL type | Exact values |
| --- | --- | --- |
| `roleEnum` | `app_role` | `admin`, `player` |
| `attendanceStatusEnum` | `attendance_status` | `xadir`, `maqan`, `daahay` |
| `requestStatusEnum` | `request_status` | `pending`, `approved`, `denied` |
| `financeTypeEnum` | `finance_type` | `income`, `expense` |
| `requestOriginEnum` | `request_origin` | `admin`, `player` |

The exported readonly value tuples are the single source for both Drizzle enum
construction and narrow TypeScript unions. `app_role` and `request_origin` have
the same current values but remain separate database types: one identifies an
authenticated actor and the other records who originated a request.

Excuse-request attendance type is not added here. Although it is a subset of
attendance values (`maqan`, `daahay`), its final table-level constraint belongs
to P3-06 so this task does not pre-empt that domain design.

## Audit columns

`auditColumns()` returns fresh Drizzle builders for `created_at` and `updated_at`
so domain tables can safely spread them into their definitions. Both columns:

- are PostgreSQL `timestamp(3) with time zone` values represented as JavaScript
  `Date` objects;
- are non-null;
- default to PostgreSQL `now()`.

`updated_at` additionally uses Drizzle's `$onUpdate` hook to generate a new
application timestamp when an update omits the column. This hook is not a
PostgreSQL trigger: any future direct-SQL writer must explicitly maintain
`updated_at`. PostgreSQL stores timezone-aware instants; display localization is
an application concern.

## Validation boundary

The focused unit test checks exact enum names and values, their TypeScript
unions, and the audit builders' column names, nullability, defaults, timezone,
precision, and update hook. Drizzle generation is exercised offline into a
temporary directory during verification. Its output is evidence only and is not
committed because P3-09 owns the initial application migration.
