import {
  boolean,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { auditColumns } from './audit'

export const players = pgTable('players', {
  id: uuid('id').defaultRandom().primaryKey(),
  authUserId: text('auth_user_id').unique(),
  name: varchar('name', { length: 255 }).notNull(),
  nickname: varchar('nickname', { length: 255 }),
  position: varchar('position', { length: 100 }),
  jerseyNumber: integer('jersey_number'),
  whatsapp: varchar('whatsapp', { length: 50 }),
  legacyPin: varchar('legacy_pin', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  ...auditColumns(),
})

export type Player = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert
