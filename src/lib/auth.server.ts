import '@tanstack/react-start/server-only'

import crypto from 'node:crypto'
import { eq, sql } from 'drizzle-orm'

import { getDatabase } from '../db/connection.server'
import {
  authAccounts,
  authSessions,
  authUsers,
  loginLogs,
  players,
} from '../db/schema'
import type { AuthenticatedActor } from './authorization'
import { getServerEnv } from './env.server'

const SESSION_COOKIE_NAME = 'best_official_session'
const SESSION_MAX_AGE_DAYS = 30

/**
 * Generates a cryptographically secure random session token.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hashes a password using crypto.scrypt with a random 16-byte salt.
 * Returns format: "salt:hash"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifies a plain text password against a stored "salt:hash" or legacy HMAC hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false

  try {
    if (storedHash.includes(':')) {
      const [salt, key] = storedHash.split(':')
      if (!salt || !key) return false
      const keyBuffer = Buffer.from(key, 'hex')
      const derivedKey = crypto.scryptSync(password, salt, 64)
      return crypto.timingSafeEqual(keyBuffer, derivedKey)
    }

    // Fallback: HMAC SHA-256 for legacy or env-based secret
    const { BETTER_AUTH_SECRET } = getServerEnv().secrets
    const hmac = crypto
      .createHmac('sha256', BETTER_AUTH_SECRET)
      .update(password)
      .digest('hex')
    return crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(hmac))
  } catch {
    return false
  }
}

/**
 * Appends a login entry and ensures the log never exceeds 200 records.
 */
export async function recordLoginEvent(data: {
  role: 'admin' | 'player'
  displayName: string
  playerId?: string | null
}): Promise<void> {
  const db = getDatabase()
  try {
    await db.insert(loginLogs).values({
      role: data.role,
      displayName: data.displayName,
      playerId: data.playerId ?? null,
      loggedInAt: new Date(),
    })

    // Prune entries older than the 200 most recent
    await db.execute(sql`
      DELETE FROM login_logs
      WHERE id NOT IN (
        SELECT id FROM login_logs
        ORDER BY logged_in_at DESC
        LIMIT 200
      )
    `)
  } catch (err) {
    console.error('Failed to record login log:', err)
  }
}

/**
 * Creates a persistent session in PostgreSQL for an actor.
 */
export async function createSession(data: {
  userId: string
  role: 'admin' | 'player'
  playerId?: string | null
  userAgent?: string
  ipAddress?: string
}): Promise<string> {
  const db = getDatabase()
  const token = generateToken()
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  )

  await db.insert(authSessions).values({
    id: crypto.randomUUID(),
    token,
    userId: data.userId,
    role: data.role,
    playerId: data.playerId ?? null,
    userAgent: data.userAgent ?? null,
    ipAddress: data.ipAddress ?? null,
    expiresAt,
  })

  return token
}

/**
 * Explicit admin account provisioning utility (used by database seed/setup routines).
 */
export async function provisionAdminAccount(data: {
  username: string
  name: string
  password: string
  forceReset?: boolean
}): Promise<{ provisioned: boolean; message: string }> {
  const db = getDatabase()
  const trimmedUser = data.username.trim().toLowerCase()
  const userId = crypto.randomUUID()
  const passwordHash = hashPassword(data.password)

  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(authUsers)
      .where(eq(authUsers.username, trimmedUser))
      .limit(1)

    if (existing[0]) {
      if (data.forceReset) {
        await tx
          .update(authAccounts)
          .set({ password: passwordHash, updatedAt: new Date() })
          .where(eq(authAccounts.userId, existing[0].id))
        return {
          provisioned: true,
          message: 'Admin account password was force-reset.',
        }
      }
      return {
        provisioned: false,
        message: 'Admin account already exists. Password preserved.',
      }
    }

    await tx.insert(authUsers).values({
      id: userId,
      name: data.name,
      email: `${trimmedUser}@bestofficial.club`,
      username: trimmedUser,
      role: 'admin',
    })

    await tx.insert(authAccounts).values({
      id: crypto.randomUUID(),
      accountId: trimmedUser,
      providerId: 'credential',
      userId,
      password: passwordHash,
    })

    return {
      provisioned: true,
      message: 'Admin account created successfully.',
    }
  })
}

/**
 * Authenticates Admin with username and password.
 * Strictly verifies the password against stored account hash.
 * Auto-creation is strictly disabled to prevent unauthenticated provisioning (C-01).
 */
export async function loginAdmin(
  username: string,
  pass: string,
  context?: { userAgent?: string; ipAddress?: string },
): Promise<{ token: string; actor: AuthenticatedActor }> {
  if (!username.trim() || !pass) {
    throw new Error(
      'Fadlan geli magaca maamulaha iyo furaha sirta ah (Username and password required)',
    )
  }

  const db = getDatabase()
  const trimmedUser = username.trim().toLowerCase()

  // Find user by username
  const userRows = await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.username, trimmedUser))
    .limit(1)

  const user = userRows[0]
  if (!user || user.role !== 'admin') {
    throw new Error(
      'Magaca maamulaha ama furaha sirta ah waa qalad (Invalid credentials)',
    )
  }

  // Verify password from account table
  const accountRows = await db
    .select()
    .from(authAccounts)
    .where(eq(authAccounts.userId, user.id))
    .limit(1)

  const account = accountRows[0]
  if (!account?.password) {
    throw new Error(
      'Magaca maamulaha ama furaha sirta ah waa qalad (Invalid credentials)',
    )
  }

  const isPasswordValid = verifyPassword(pass, account.password)
  if (!isPasswordValid) {
    throw new Error(
      'Magaca maamulaha ama furaha sirta ah waa qalad (Invalid credentials)',
    )
  }

  const token = await createSession({
    userId: user.id,
    role: 'admin',
    userAgent: context?.userAgent,
    ipAddress: context?.ipAddress,
  })

  await recordLoginEvent({
    role: 'admin',
    displayName: user.name,
  })

  return {
    token,
    actor: {
      userId: user.id,
      role: 'admin',
      name: user.name,
    },
  }
}

/**
 * Passwordless Player Login: selects active player from roster.
 */
export async function loginPlayer(
  playerId: string,
  context?: { userAgent?: string; ipAddress?: string },
): Promise<{ token: string; actor: AuthenticatedActor }> {
  const db = getDatabase()

  const playerRows = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1)

  const player = playerRows[0]
  if (!player) {
    throw new Error('Ciyaartoygan lama helin (Player not found)')
  }

  if (!player.isActive) {
    throw new Error('Ciyaartoygan hadda ma shaqeynayo (Player is deactivated)')
  }

  // Ensure an auth_user record exists for this player
  let userId = player.authUserId
  if (!userId) {
    userId = crypto.randomUUID()
    await db.insert(authUsers).values({
      id: userId,
      name: player.name,
      email: `player_${player.id}@bestofficial.club`,
      role: 'player',
    })
    await db
      .update(players)
      .set({ authUserId: userId })
      .where(eq(players.id, player.id))
  }

  const token = await createSession({
    userId,
    role: 'player',
    playerId: player.id,
    userAgent: context?.userAgent,
    ipAddress: context?.ipAddress,
  })

  await recordLoginEvent({
    role: 'player',
    displayName: player.name,
    playerId: player.id,
  })

  return {
    token,
    actor: {
      userId,
      role: 'player',
      name: player.name,
      playerId: player.id,
    },
  }
}

/**
 * Resolves session actor from session token.
 */
export async function resolveActorFromToken(
  token: string | null | undefined,
): Promise<AuthenticatedActor | null> {
  if (!token) return null

  const db = getDatabase()
  const sessionRows = await db
    .select({
      session: authSessions,
      user: authUsers,
    })
    .from(authSessions)
    .innerJoin(authUsers, eq(authSessions.userId, authUsers.id))
    .where(eq(authSessions.token, token))
    .limit(1)

  const row = sessionRows[0]
  if (!row) return null

  // Check expiration
  if (row.session.expiresAt < new Date()) {
    await db.delete(authSessions).where(eq(authSessions.token, token))
    return null
  }

  return {
    userId: row.user.id,
    role: row.session.role,
    name: row.user.name,
    playerId: row.session.playerId,
  }
}

/**
 * Logs out and invalidates the session token.
 */
export async function destroySession(token: string): Promise<void> {
  const db = getDatabase()
  await db.delete(authSessions).where(eq(authSessions.token, token))
}

export { SESSION_COOKIE_NAME }
