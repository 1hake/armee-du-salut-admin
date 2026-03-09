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
}, (t) => [
  uniqueIndex('bookings_uniq').on(t.roomId, t.weekKey, t.dayIndex, t.slot),
])

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
}, (t) => [
  uniqueIndex('schedule_uniq').on(t.employeeId, t.date),
])

export const organisationColors = sqliteTable('organisation_colors', {
  organisation: text('organisation').primaryKey(),
  color:        text('color').notNull(),
  bg:           text('bg').notNull(),
})

export type Room = typeof rooms.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type Employee = typeof employees.$inferSelect
export type ScheduleEntry = typeof scheduleEntries.$inferSelect
export type OrgColor = typeof organisationColors.$inferSelect
