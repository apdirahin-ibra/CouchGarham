import { date, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core'

import { auditColumns } from './audit'
import { financeTypeEnum } from './enums'

export const financeEntries = pgTable('finance_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: financeTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  note: text('note').notNull(),
  entryDate: date('entry_date').notNull(),
  ...auditColumns(),
})

export type FinanceEntry = typeof financeEntries.$inferSelect
export type NewFinanceEntry = typeof financeEntries.$inferInsert
