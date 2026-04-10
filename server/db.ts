import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { seed } from './seed'

const dbPath = process.env.NODE_ENV === 'production' ? '/app/sqlite-data/sqlite.db' : 'sqlite.db'

let _db: BetterSQLite3Database<typeof schema> | null = null

function createTables(sqlite: InstanceType<typeof Database>) {
  // Add shift_code column if missing (migration)
  try { sqlite.exec('ALTER TABLE schedule_entries ADD COLUMN shift_code TEXT') } catch {}
  // Drop unique constraint on bookings to allow multiple bookings per slot
  try { sqlite.exec('DROP INDEX IF EXISTS bookings_uniq') } catch {}
  // Add comment column to bookings if missing
  try { sqlite.exec('ALTER TABLE bookings ADD COLUMN comment TEXT') } catch {}

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      floor TEXT NOT NULL,
      name TEXT NOT NULL,
      capacity INTEGER,
      position INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      week_key TEXT NOT NULL,
      day_index INTEGER NOT NULL,
      slot INTEGER NOT NULL,
      organisation TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS bookings_slot_idx ON bookings(room_id, week_key, day_index, slot);
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      position INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS schedule_entries (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      day_index INTEGER NOT NULL,
      status TEXT NOT NULL,
      hours INTEGER NOT NULL DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS schedule_uniq ON schedule_entries(employee_id, date);
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS schedule_overrides (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS scheduler_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      config TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS organisation_colors (
      organisation TEXT PRIMARY KEY,
      color TEXT NOT NULL,
      bg TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS organisations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      short_name TEXT,
      contact TEXT,
      phone TEXT,
      email TEXT,
      notes TEXT
    );
  `)
}

export function getDb() {
  if (!_db) {
    const sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
    createTables(sqlite)
    _db = drizzle(sqlite, { schema })
    seed()
  }
  return _db
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    return (getDb() as any)[prop]
  },
})
