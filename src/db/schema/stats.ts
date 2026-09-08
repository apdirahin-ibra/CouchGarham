import {
  index,
  integer,
  pgTable,
  text,
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

export const playerMatchRatings = pgTable(
  'player_match_ratings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: uuid('player_id')
      .references(() => players.id, { onDelete: 'cascade' })
      .notNull(),
    matchDate: varchar('match_date', { length: 10 }).notNull(),
    matchTitle: varchar('match_title', { length: 255 }),
    dhankaGoolka: integer('dhanka_goolka').default(0).notNull(),
    caawinta: integer('caawinta').default(0).notNull(),
    anshaxaCiyaarta: integer('anshaxa_ciyaarta').default(0).notNull(),
    kalsoonida: integer('kalsoonida').default(0).notNull(),
    laDhaqankaMacalinka: integer('la_dhaqanka_macalinka').default(0).notNull(),
    laDhaqankaCiyaartoydaKale: integer('la_dhaqanka_ciyaartoyda_kale')
      .default(0)
      .notNull(),
    shaqadaLooDiray: integer('shaqada_loo_diray').default(0).notNull(),
    waajibaadkaBooska: integer('waajibaadka_booska').default(0).notNull(),
    masuuliyadda: integer('masuuliyadda').default(0).notNull(),
    taktikada: integer('taktikada').default(0).notNull(),
    overallRating: varchar('overall_rating', { length: 10 })
      .default('0.0')
      .notNull(),
    coachNotes: text('coach_notes'),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('player_match_date_unique').on(table.playerId, table.matchDate),
    index('player_ratings_player_idx').on(table.playerId),
    index('player_ratings_date_idx').on(table.matchDate),
  ],
)

export type PlayerMatchRating = typeof playerMatchRatings.$inferSelect
export type NewPlayerMatchRating = typeof playerMatchRatings.$inferInsert
