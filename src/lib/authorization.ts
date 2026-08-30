export type AuthenticatedActor = {
  userId: string
  role: 'admin' | 'player'
  name: string
  playerId?: string | null
}

export class AuthorizationError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 403) {
    super(message)
    this.name = 'AuthorizationError'
    this.statusCode = statusCode
  }
}

/**
 * Requires any valid authenticated session.
 */
export function requireSession(
  actor: AuthenticatedActor | null | undefined,
): AuthenticatedActor {
  if (!actor) {
    throw new AuthorizationError('Fadlan gal koontadaada (Unauthorized)', 401)
  }
  return actor
}

/**
 * Enforces that the actor is an Admin.
 */
export function requireAdmin(
  actor: AuthenticatedActor | null | undefined,
): AuthenticatedActor {
  const session = requireSession(actor)
  if (session.role !== 'admin') {
    throw new AuthorizationError(
      'Falkan waxaa loo oggolyahay maamulaha kaliya (Forbidden: Admin only)',
      403,
    )
  }
  return session
}

/**
 * Enforces that the actor is a Player and returns their authoritative playerId.
 */
export function requirePlayer(actor: AuthenticatedActor | null | undefined): {
  actor: AuthenticatedActor
  playerId: string
} {
  const session = requireSession(actor)
  if (session.role !== 'player' || !session.playerId) {
    throw new AuthorizationError(
      'Falkan waxaa loo oggolyahay ciyaartooyda kaliya (Forbidden: Player only)',
      403,
    )
  }
  return { actor: session, playerId: session.playerId }
}

/**
 * Enforces that a player can only access or mutate their own resources.
 * Admins are permitted to access any player's resource.
 */
export function requireOwnPlayerResource(
  actor: AuthenticatedActor | null | undefined,
  targetPlayerId: string,
): AuthenticatedActor {
  const session = requireSession(actor)
  if (session.role === 'admin') {
    return session
  }
  if (session.role === 'player' && session.playerId === targetPlayerId) {
    return session
  }
  throw new AuthorizationError(
    'Uma lihid fasax xogta ciyaartoygan (Forbidden: Cannot access another player data)',
    403,
  )
}
