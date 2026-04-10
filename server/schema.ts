import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createId } from '@paralleldrive/cuid2'

export const rooms = sqliteTable('rooms', {
  id:       text('id').primaryKey().$defaultFn(() => createId()),
  floor:    text('floor').notNull(),
  name:     text('name').notNull(),
  capacity: integer('capacity'),
  position: integer('position').default(0),
})

export const bookings = sqliteTable('bookings', {
  id:           text('id').primaryKey().$defaultFn(() => createId()),
  roomId:       text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  weekKey:      text('week_key').notNull(),
  dayIndex:     integer('day_index').notNull(),
  slot:         integer('slot').notNull(),
  organisation: text('organisation').notNull(),
  comment:      text('comment'),
})

// ── Equipe ─────────────────────────────────────────────

export const employees = sqliteTable('employees', {
  id:   text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  position: integer('position').default(0),
})

export const scheduleEntries = sqliteTable('schedule_entries', {
  id:         text('id').primaryKey().$defaultFn(() => createId()),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  date:       text('date').notNull(),          // YYYY-MM-DD
  dayIndex:   integer('day_index').notNull(),   // 0=Lun … 6=Dim
  status:     text('status').notNull(),         // 'work' | 'rest' | 'weekend_work'
  hours:      integer('hours').notNull().default(0),
  shiftCode:  text('shift_code'),               // M | S | J | W | R
}, (t) => [
  uniqueIndex('schedule_uniq').on(t.employeeId, t.date),
])

export const organisationColors = sqliteTable('organisation_colors', {
  organisation: text('organisation').primaryKey(),
  color:        text('color').notNull(),
  bg:           text('bg').notNull(),
})

// ── Organisations Directory ─────────────────────────────

export const organisations = sqliteTable('organisations', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  name:      text('name').notNull().unique(),
  shortName: text('short_name'),
  contact:   text('contact'),
  phone:     text('phone'),
  email:     text('email'),
  notes:     text('notes'),
})

// ── Schedule Overrides (changements ponctuels) ──────────

export const scheduleOverrides = sqliteTable('schedule_overrides', {
  id:         text('id').primaryKey().$defaultFn(() => createId()),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  date:       text('date').notNull(),          // YYYY-MM-DD
  description: text('description').notNull(),  // e.g. "Repos maladie", "Échange avec Pierre"
  createdAt:  text('created_at').$defaultFn(() => new Date().toISOString()),
})

// ── Users & Sessions ─────────────────────────────────────

export const users = sqliteTable('users', {
  id:         text('id').primaryKey().$defaultFn(() => createId()),
  username:   text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role:       text('role').notNull().default('employee'),  // 'admin' | 'employee'
  employeeId: text('employee_id').references(() => employees.id, { onDelete: 'set null' }),
})

export const sessions = sqliteTable('sessions', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
})

// ── Scheduler Config ────────────────────────────────────

export const schedulerConfig = sqliteTable('scheduler_config', {
  id:     text('id').primaryKey().default('default'),
  config: text('config').notNull(),  // JSON blob
})

export type Room = typeof rooms.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type Employee = typeof employees.$inferSelect
export type ScheduleEntry = typeof scheduleEntries.$inferSelect
export type OrgColor = typeof organisationColors.$inferSelect
export type Organisation = typeof organisations.$inferSelect
export type ScheduleOverride = typeof scheduleOverrides.$inferSelect
export type User = typeof users.$inferSelect
export type Session = typeof sessions.$inferSelect
