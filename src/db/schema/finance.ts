import {
  date,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { auditColumns } from './audit'
import { financeTypeEnum } from './enums'
import { players } from './players'

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

export const playerFeeRecords = pgTable(
  'player_fee_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    monthKey: varchar('month_key', { length: 7 }).notNull(),
    expectedAmount: numeric('expected_amount', { precision: 12, scale: 2 })
      .default('10.00')
      .notNull(),
    paidAmount: numeric('paid_amount', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    status: varchar('status', { length: 50 }).default('unpaid').notNull(),
    paidAt: date('paid_at'),
    note: text('note'),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('player_fee_month_idx').on(table.playerId, table.monthKey),
  ],
)

export type PlayerFeeRecord = typeof playerFeeRecords.$inferSelect
export type NewPlayerFeeRecord = typeof playerFeeRecords.$inferInsert
