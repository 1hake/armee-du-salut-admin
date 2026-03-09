import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { seed } from './seed'

const dbPath = process.env.NODE_ENV === 'production' ? '/app/sqlite-data/sqlite.db' : 'sqlite.db'

let _db: BetterSQLite3Database<typeof schema> | null = null

export function getDb() {
  if (!_db) {
    const sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
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
