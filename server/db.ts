import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { seed } from './seed'

const dbPath = process.env.NODE_ENV === 'production' ? '/app/sqlite-data/sqlite.db' : 'sqlite.db'
const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

seed()
