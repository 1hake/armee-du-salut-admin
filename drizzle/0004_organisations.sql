CREATE TABLE IF NOT EXISTS organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT
);
