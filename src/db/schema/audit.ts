import { timestamp } from 'drizzle-orm/pg-core'

/**
 * Shared audit columns for mutable domain tables.
 *
 * PostgreSQL stores these as timezone-aware instants. Drizzle supplies the
 * creation default and refreshes `updatedAt` when an application update omits
 * that column. Direct SQL writers must update `updated_at` themselves.
 */
export function auditColumns() {
  return {
    createdAt: timestamp('created_at', {
      mode: 'date',
      precision: 3,
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', {
      mode: 'date',
      precision: 3,
      withTimezone: true,
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }
}
