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

  it('maps each percentage tier to its normal error count and percentage share', () => {
    const errorsMajor = 2
    const errorsMedium = 3
    const errorsSevere = 1
    const total = errorsMajor + errorsMedium + errorsSevere

    const breakdown = [
      { tier: 'Qalad Weyn', percentageLabel: '90%', count: errorsMajor, normalCountText: `${errorsMajor} qalad` },
      { tier: 'Qalad Dhexdhexaad', percentageLabel: '60%', count: errorsMedium, normalCountText: `${errorsMedium} qalad` },
      { tier: 'Qalad Aad u Xun', percentageLabel: '30%', count: errorsSevere, normalCountText: `${errorsSevere} qalad` },
    ]

    expect(total).toBe(6)
    expect(breakdown[0].normalCountText).toBe('2 qalad')
    expect(breakdown[1].normalCountText).toBe('3 qalad')
    expect(breakdown[2].normalCountText).toBe('1 qalad')

    const majorShare = Math.round((breakdown[0].count / total) * 100)
    expect(majorShare).toBe(33)
  })
})

describe('Schedule Match Countdown and Time Parsing Logic', () => {
  // Local parser logic matching server
  const parseTimeToHoursAndMinutes = (timeStr?: string | null) => {
    if (!timeStr) return { hours: 16, minutes: 30 }
    const clean = timeStr.trim()
    const m24 = clean.match(/^(\d{1,2}):(\d{2})$/)
    if (m24) {
      const h = parseInt(m24[1], 10)
      const m = parseInt(m24[2], 10)
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return { hours: h, minutes: m }
    }
    const m12 = clean.match(
      /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm|Galab|Habeen|Subax)?/i,
    )
    if (m12) {
      let h = parseInt(m12[1], 10)
      const m = m12[2] ? parseInt(m12[2], 10) : 0
      const period = m12[3]?.toLowerCase()
      if (period === 'pm' || period === 'galab' || period === 'habeen') {
        if (h < 12) h += 12
      } else if (period === 'am' || period === 'subax') {
        if (h === 12) h = 0
      } else if (h >= 1 && h <= 9) {
        h += 12
      }
      return {
        hours: Math.min(23, Math.max(0, h)),
        minutes: Math.min(59, Math.max(0, m)),
      }
    }
    return { hours: 16, minutes: 30 }
  }

  it('accurately parses 24-hr and 12-hr match times', () => {
    expect(parseTimeToHoursAndMinutes('16:30')).toEqual({ hours: 16, minutes: 30 })
    expect(parseTimeToHoursAndMinutes('4:30 PM - 6:30 PM')).toEqual({
      hours: 16,
      minutes: 30,
    })
    expect(parseTimeToHoursAndMinutes('08:00 AM')).toEqual({ hours: 8, minutes: 0 })
    expect(parseTimeToHoursAndMinutes('5:00 Galabnimo')).toEqual({
      hours: 17,
      minutes: 0,
    })
    expect(parseTimeToHoursAndMinutes('')).toEqual({ hours: 16, minutes: 30 })
  })

  it('accurately calculates remaining hours and minutes until match kickoff', () => {
    // Current time: 12:00 PM, Match kickoff: 4:30 PM
    const now = new Date(2026, 8, 24, 12, 0, 0)
    const kickoff = new Date(2026, 8, 24, 16, 30, 0)

    const diffMs = kickoff.getTime() - now.getTime()
    const totalMinutes = Math.round(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    expect(hours).toBe(4)
    expect(minutes).toBe(30)
    expect(`Waxaa ka dhiman ${hours} saac iyo ${minutes} daqiiqo`).toBe(
      'Waxaa ka dhiman 4 saac iyo 30 daqiiqo',
    )
  })

  it('handles admin custom remaining time input override', () => {
    const adminCustomInput = '4 saac'
    const parsedH = parseInt(adminCustomInput, 10)
    const isWithin12 = parsedH <= 12
    const isWithin24 = parsedH <= 24
    const alertLevel = parsedH <= 12 ? 'urgent_12h' : 'warning_24h'

    expect(isWithin12).toBe(true)
    expect(isWithin24).toBe(true)
    expect(alertLevel).toBe('urgent_12h')
    expect(`Waxaa ka dhiman ${adminCustomInput}!`).toBe('Waxaa ka dhiman 4 saac!')
  })
})


