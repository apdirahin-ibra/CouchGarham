import {
  integer,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { auditColumns } from './audit'
import { players } from './players'

export const playerMonthlyStats = pgTable(
  'player_monthly_stats',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .references(() => players.id, { onDelete: 'cascade' })
      .notNull(),
    monthKey: varchar('month_key', { length: 7 }).notNull(),
    goals: integer('goals').default(0).notNull(),
    assists: integer('assists').default(0).notNull(),
    errors: integer('errors').default(0).notNull(),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('player_month_stats_unique').on(table.playerId, table.monthKey),
  ],
)

export type PlayerMonthlyStat = typeof playerMonthlyStats.$inferSelect
export type NewPlayerMonthlyStat = typeof playerMonthlyStats.$inferInsert
