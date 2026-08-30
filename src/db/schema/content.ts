import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { auditColumns } from './audit'
import { roleEnum } from './enums'
import { players } from './players'

export const tips = pgTable('tips', {
  id: uuid('id').defaultRandom().primaryKey(),
  text: text('text').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  ...auditColumns(),
})

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorRole: roleEnum('author_role').notNull(),
    playerId: uuid('player_id').references(() => players.id, {
      onDelete: 'set null',
    }),
    authorNameSnapshot: varchar('author_name_snapshot', {
      length: 255,
    }).notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', {
      mode: 'date',
      precision: 3,
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('chat_messages_created_idx').on(table.createdAt)],
)

export const loginLogs = pgTable(
  'login_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    role: roleEnum('role').notNull(),
    playerId: uuid('player_id').references(() => players.id, {
      onDelete: 'set null',
    }),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    loggedInAt: timestamp('logged_in_at', {
      mode: 'date',
      precision: 3,
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('login_logs_logged_in_idx').on(table.loggedInAt)],
)

export const scheduleEntries = pgTable('schedule_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  dayName: varchar('day_name', { length: 50 }).notNull(),
  timeText: varchar('time_text', { length: 100 }).notNull(),
  place: varchar('place', { length: 255 }).notNull(),
  ...auditColumns(),
})

export const galleryPhotos = pgTable(
  'gallery_photos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storageBucket: varchar('storage_bucket', { length: 100 })
      .default('club-gallery')
      .notNull(),
    storagePath: text('storage_path').notNull(),
    caption: text('caption'),
    uploadedBy: varchar('uploaded_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', {
      mode: 'date',
      precision: 3,
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('gallery_photos_created_idx').on(table.createdAt)],
)

export const clubSettings = pgTable('club_settings', {
  id: varchar('id', { length: 50 }).primaryKey().default('default'),
  rulesText: text('rules_text').notNull().default(''),
  announcementText: text('announcement_text').notNull().default(''),
  announcementAudioPath: text('announcement_audio_path'),
  adminWhatsapp: varchar('admin_whatsapp', { length: 50 }),
  updatedAt: timestamp('updated_at', {
    mode: 'date',
    precision: 3,
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export type Tip = typeof tips.$inferSelect
export type NewTip = typeof tips.$inferInsert
export type ChatMessage = typeof chatMessages.$inferSelect
export type NewChatMessage = typeof chatMessages.$inferInsert
export type LoginLog = typeof loginLogs.$inferSelect
export type NewLoginLog = typeof loginLogs.$inferInsert
export type ScheduleEntry = typeof scheduleEntries.$inferSelect
export type NewScheduleEntry = typeof scheduleEntries.$inferInsert
export type GalleryPhoto = typeof galleryPhotos.$inferSelect
export type NewGalleryPhoto = typeof galleryPhotos.$inferInsert
export type ClubSettings = typeof clubSettings.$inferSelect
export type NewClubSettings = typeof clubSettings.$inferInsert
