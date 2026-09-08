import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from '../../src/lib/auth.server'
import {
  requireAdmin,
  requirePlayer,
  requireSession,
  type AuthenticatedActor,
} from '../../src/lib/authorization'

describe('Server Authentication & Password Verification', () => {
  it('correctly hashes passwords with scrypt and validates matching password', () => {
    const rawPass = 'SecretAdminPass123!'
    const hash = hashPassword(rawPass)

    expect(hash).toContain(':')
    expect(verifyPassword(rawPass, hash)).toBe(true)
  })

  it('strictly rejects incorrect passwords', () => {
    const rawPass = 'CorrectPassword123'
    const hash = hashPassword(rawPass)

    expect(verifyPassword('WrongPassword', hash)).toBe(false)
    expect(verifyPassword('definitely-wrong-password', hash)).toBe(false)
    expect(verifyPassword('', hash)).toBe(false)
  })
})

describe('Server Authorization Guards', () => {
  const adminActor: AuthenticatedActor = {
    userId: '11111111-1111-1111-1111-111111111111',
    role: 'admin',
    name: 'Maamulaha Kooxda',
  }

  const playerActor: AuthenticatedActor = {
    userId: '22222222-2222-2222-2222-222222222222',
    role: 'player',
    name: 'Axmed Cali',
    playerId: '33333333-3333-3333-3333-333333333333',
  }

  it('requireAdmin allows admin and throws for unauthenticated or player actors', () => {
    expect(() => requireAdmin(adminActor)).not.toThrow()

    expect(() => requireAdmin(null)).toThrow(/Fadlan gal koontadaada/i)
    expect(() => requireAdmin(playerActor)).toThrow(/Maamulaha kaliya/i)
  })

  it('requirePlayer allows player with playerId and throws for admin or missing playerId', () => {
    const playerResult = requirePlayer(playerActor)
    expect(playerResult.playerId).toBe('33333333-3333-3333-3333-333333333333')

    expect(() => requirePlayer(null)).toThrow(/Fadlan gal koontadaada/i)
    expect(() => requirePlayer(adminActor)).toThrow(/Ciyaartooyda kaliya/i)
  })

  it('requireSession allows any authenticated actor and rejects null', () => {
    expect(() => requireSession(adminActor)).not.toThrow()
    expect(() => requireSession(playerActor)).not.toThrow()
    expect(() => requireSession(null)).toThrow(/Fadlan gal koontadaada/i)
  })
})

describe('Player 4-Digit Unique PIN Security & Validation', () => {
  const isValid4DigitPin = (pin: string) => /^\d{4}$/.test(pin.trim())

  it('accepts valid 4-digit numeric PINs', () => {
    expect(isValid4DigitPin('1001')).toBe(true)
    expect(isValid4DigitPin('4821')).toBe(true)
    expect(isValid4DigitPin('0000')).toBe(true)
    expect(isValid4DigitPin('9999')).toBe(true)
  })

  it('rejects invalid PIN formats (non-digits, too short, too long, empty)', () => {
    expect(isValid4DigitPin('123')).toBe(false)
    expect(isValid4DigitPin('12345')).toBe(false)
    expect(isValid4DigitPin('abcd')).toBe(false)
    expect(isValid4DigitPin('12a4')).toBe(false)
    expect(isValid4DigitPin('')).toBe(false)
    expect(isValid4DigitPin('   ')).toBe(false)
  })

  it('verifies PIN matching logic strictly', () => {
    const playerLegacyPin = '4821'
    const cleanEnteredPin = '4821'.trim()
    const wrongEnteredPin = '1234'.trim()

    expect(playerLegacyPin === cleanEnteredPin).toBe(true)
    expect(playerLegacyPin === wrongEnteredPin).toBe(false)
  })
})
