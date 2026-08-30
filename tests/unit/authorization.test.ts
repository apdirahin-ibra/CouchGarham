import { describe, expect, it } from 'vitest'

import {
  AuthorizationError,
  requireAdmin,
  requireOwnPlayerResource,
  requirePlayer,
  requireSession,
} from '#/lib/authorization'

describe('authorization guards', () => {
  const adminActor = {
    userId: 'admin-1',
    role: 'admin' as const,
    name: 'Admin Coach',
  }

  const playerActor = {
    userId: 'player-user-1',
    role: 'player' as const,
    name: 'Axmed Cali',
    playerId: 'player-uuid-1',
  }

  it('requireSession throws on null or undefined', () => {
    expect(() => requireSession(null)).toThrow(AuthorizationError)
    expect(() => requireSession(undefined)).toThrow(AuthorizationError)
    expect(requireSession(adminActor)).toEqual(adminActor)
  })

  it('requireAdmin allows admin and blocks player', () => {
    expect(requireAdmin(adminActor)).toEqual(adminActor)
    expect(() => requireAdmin(playerActor)).toThrow(AuthorizationError)
  })

  it('requirePlayer allows player and returns playerId', () => {
    const result = requirePlayer(playerActor)
    expect(result.playerId).toBe('player-uuid-1')
    expect(result.actor).toEqual(playerActor)
    expect(() => requirePlayer(adminActor)).toThrow(AuthorizationError)
  })

  it('requireOwnPlayerResource allows own player and admin, blocks other player', () => {
    // Admin can access any player
    expect(requireOwnPlayerResource(adminActor, 'player-uuid-1')).toEqual(
      adminActor,
    )
    expect(requireOwnPlayerResource(adminActor, 'player-uuid-2')).toEqual(
      adminActor,
    )

    // Player can access own id
    expect(requireOwnPlayerResource(playerActor, 'player-uuid-1')).toEqual(
      playerActor,
    )

    // Player cannot access another player's id
    expect(() =>
      requireOwnPlayerResource(playerActor, 'player-uuid-2'),
    ).toThrow(AuthorizationError)
  })
})
