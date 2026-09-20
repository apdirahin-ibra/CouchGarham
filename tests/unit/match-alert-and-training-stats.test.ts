import { describe, expect, it } from 'vitest'

describe('Match Alarm and Countdown logic', () => {
  it('identifies match day alert correctly', () => {
    const todayStr = '2026-09-20'
    const matchDateStr = '2026-09-20'
    const isMatchDay = matchDateStr === todayStr
    expect(isMatchDay).toBe(true)

    const level = isMatchDay ? 'match_day' : 'none'
    expect(level).toBe('match_day')
  })

  it('determines 12h urgent warning alert', () => {
    const diffHours = 8
    const isWithin12 = diffHours > 0 && diffHours <= 12
    const isWithin24 = diffHours > 0 && diffHours <= 24
    expect(isWithin12).toBe(true)
    expect(isWithin24).toBe(true)

    const alertLevel = diffHours <= 12 ? 'urgent_12h' : 'warning_24h'
    expect(alertLevel).toBe('urgent_12h')
  })

  it('determines 24h warning alert', () => {
    const diffHours = 18
    const isWithin12 = diffHours > 0 && diffHours <= 12
    const isWithin24 = diffHours > 0 && diffHours <= 24
    expect(isWithin12).toBe(false)
    expect(isWithin24).toBe(true)

    const alertLevel = diffHours <= 12 ? 'urgent_12h' : 'warning_24h'
    expect(alertLevel).toBe('warning_24h')
  })
})

describe('Training Performance 3-Tier System (Natiijada Tababarka)', () => {
  const getTrainingTierInfo = (score: number) => {
    if (score >= 100) {
      return {
        tier: 'excellent',
        label: 'Aad u Fiican (100%)',
        percentage: 100,
        color: 'success',
        isDanger: false,
      }
    }
    if (score >= 60) {
      return {
        tier: 'medium',
        label: 'Dhexdhexaad (60%)',
        percentage: 60,
        color: 'warning',
        isDanger: false,
      }
    }
    return {
      tier: 'danger',
      label: 'Hooseeye Halis (30%)',
      percentage: 30,
      color: 'danger',
      isDanger: true,
    }
  }

  it('classifies 100% as Aad u Fiican', () => {
    const info = getTrainingTierInfo(100)
    expect(info.tier).toBe('excellent')
    expect(info.label).toBe('Aad u Fiican (100%)')
    expect(info.percentage).toBe(100)
    expect(info.isDanger).toBe(false)
  })

  it('classifies 60% as Dhexdhexaad', () => {
    const info = getTrainingTierInfo(60)
    expect(info.tier).toBe('medium')
    expect(info.label).toBe('Dhexdhexaad (60%)')
    expect(info.percentage).toBe(60)
    expect(info.isDanger).toBe(false)
  })

  it('classifies 30% as Hooseeye Halis with red danger indicator', () => {
    const info = getTrainingTierInfo(30)
    expect(info.tier).toBe('danger')
    expect(info.label).toBe('Hooseeye Halis (30%)')
    expect(info.percentage).toBe(30)
    expect(info.color).toBe('danger')
    expect(info.isDanger).toBe(true)
  })
})

describe('Team Errors 3-Tier Breakdown (Qaladaadka Kooxda)', () => {
  const calculateTotalErrors = (major90: number, medium60: number, severe30: number) => {
    return major90 + medium60 + severe30
  }

  it('sums errors accurately across all 3 tiers', () => {
    const errorsMajor90 = 2 // Qalad Weyn (90%)
    const errorsMedium60 = 3 // Qalad Dhexdhexaad (60%)
    const errorsSevere30 = 1 // Qalad Aad u Xun (30%)

    const total = calculateTotalErrors(errorsMajor90, errorsMedium60, errorsSevere30)
    expect(total).toBe(6)
  })

  it('handles zero error scenarios', () => {
    const total = calculateTotalErrors(0, 0, 0)
    expect(total).toBe(0)
  })
})
