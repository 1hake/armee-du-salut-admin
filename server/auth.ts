'use server'

import { db } from './db'
import { users, sessions } from './schema'
import type { User } from './schema'
import { eq, and, gt } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { createId } from '@paralleldrive/cuid2'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const SESSION_COOKIE = 'session'
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// ── Password hashing ─────────────────────────────────────

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const buf = Buffer.from(hash, 'hex')
  const supplied = scryptSync(password, salt, 64)
  return timingSafeEqual(buf, supplied)
}

// ── Session management ───────────────────────────────────

async function createSession(userId: string): Promise<string> {
  const id = createId()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString()
  db.insert(sessions).values({ id, userId, expiresAt }).run()
  return id
}

export async function getSession(): Promise<(User & { sessionId: string }) | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const now = new Date().toISOString()
  const rows = db
    .select()
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, now)))
    .all()

  if (rows.length === 0) return null
  return { ...rows[0].users, sessionId: rows[0].sessions.id }
}

export async function requireAuth(): Promise<User> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'admin') redirect('/')
  return user
}

// ── Auth actions ─────────────────────────────────────────

export async function login(username: string, password: string): Promise<{ error?: string }> {
  const user = db.select().from(users).where(eq(users.username, username)).get()
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: 'Identifiant ou mot de passe incorrect' }
  }

  const sessionId = await createSession(user.id)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS / 1000,
    path: '/',
  })
  return {}
}

export async function logout() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    db.delete(sessions).where(eq(sessions.id, token)).run()
  }
  cookieStore.delete(SESSION_COOKIE)
  redirect('/login')
}

// ── User management (admin only) ─────────────────────────

export async function getUsers() {
  return db.select().from(users).all()
}

export async function createUser(username: string, password: string, role: string, employeeId: string | null) {
  const existing = db.select().from(users).where(eq(users.username, username)).get()
  if (existing) throw new Error('Ce nom d\'utilisateur existe deja')

  db.insert(users).values({
    username,
    passwordHash: hashPassword(password),
    role,
    employeeId,
  }).run()
  revalidatePath('/admin/users')
}

export async function updateUserPassword(userId: string, newPassword: string) {
  db.update(users)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(users.id, userId))
    .run()
}

export async function deleteUser(userId: string) {
  db.delete(users).where(eq(users.id, userId)).run()
  revalidatePath('/admin/users')
}

