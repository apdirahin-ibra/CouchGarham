export const PLAYER_RATING_CRITERIA = [
  {
    key: 'dhankaGoolka',
    label: 'Dhanka Goolka',
    description: 'Dhaliinta goolasha, toogashada iyo halista weerarka',
  },
  {
    key: 'caawinta',
    label: 'Caawinta',
    description: 'Baasaska wax-ku-oolka ah iyo caawinta goolasha',
  },
  {
    key: 'anshaxaCiyaarta',
    label: 'Anshaxa Ciyaarta',
    description: 'Anshaxa garoonka, ka fogaanshaha kaararka iyo caddaaladda',
  },
  {
    key: 'kalsoonida',
    label: 'Kalsoonida',
    description: "Isku-kalsoonaanta xilliga ciyaarta iyo go'aan qaadashada",
  },
  {
    key: 'laDhaqankaMacalinka',
    label: 'La dhaqanka Macalinka',
    description: 'Dhageysiga talooyinka macalinka iyo ixtiraamka',
  },
  {
    key: 'laDhaqankaCiyaartoydaKale',
    label: 'La dhaqanka Ciyaartoyda kale',
    description: 'Wadashaqeynta kooxda (teamwork) iyo dhiirigelinta',
  },
  {
    key: 'shaqadaLooDiray',
    label: 'Shaqada loo diray',
    description: 'Dhabar-adayga iyo fulinta waajibaadkii loo xilsaaray',
  },
  {
    key: 'waajibaadkaBooska',
    label: 'Waajibaadka Booska',
    description: 'Ilaalinta iyo qabashada shaqada booska uu ka ciyaarayo',
  },
  {
    key: 'masuuliyadda',
    label: "Mas'uuliyadda",
    description: "Dareenka mas'uuliyadda, daryeelka agabka iyo waqtiga",
  },
  {
    key: 'taktikada',
    label: 'Taktikada la isticmaalay',
    description: 'Fahamka iyo ku dhaqanka taatikada kooxda',
  },
] as const

export type RatingCriterionKey = (typeof PLAYER_RATING_CRITERIA)[number]['key']

export type RatingCriterionValues = {
  dhankaGoolka?: number
  caawinta?: number
  anshaxaCiyaarta?: number
  kalsoonida?: number
  laDhaqankaMacalinka?: number
  laDhaqankaCiyaartoydaKale?: number
  shaqadaLooDiray?: number
  waajibaadkaBooska?: number
  masuuliyadda?: number
  taktikada?: number
}

export function getRatingBadgeInfo(average: number): {
  badge: string
  tone: 'success' | 'warning' | 'danger' | 'gold' | 'neutral'
} {
  if (average >= 4.5) {
    return { badge: 'Heer Sare', tone: 'gold' }
  } else if (average >= 3.8) {
    return { badge: 'Aad u Wanaagsan', tone: 'success' }
  } else if (average >= 3.0) {
    return { badge: 'Wanaagsan', tone: 'neutral' }
  } else if (average >= 2.0) {
    return { badge: 'Dhexdhexaad', tone: 'warning' }
  } else if (average > 0) {
    return { badge: 'U Baahan Horumarin', tone: 'danger' }
  }
  return { badge: 'Aan la Qiimeyn', tone: 'neutral' }
}

export function computeOverallRatingScore(input: RatingCriterionValues): {
  average: number
  formatted: string
  totalPoints: number
  badge: string
  tone: 'success' | 'warning' | 'danger' | 'gold' | 'neutral'
} {
  const values = [
    input.dhankaGoolka,
    input.caawinta,
    input.anshaxaCiyaarta,
    input.kalsoonida,
    input.laDhaqankaMacalinka,
    input.laDhaqankaCiyaartoydaKale,
    input.shaqadaLooDiray,
    input.waajibaadkaBooska,
    input.masuuliyadda,
    input.taktikada,
  ]
  const totalPoints: number = values.reduce(
    (sum: number, v: number | undefined): number =>
      sum + Math.max(0, Math.min(5, v ?? 0)),
    0,
  )
  const average = Math.round((totalPoints / 10) * 10) / 10
  const formatted = average.toFixed(1)

  const { badge, tone } = getRatingBadgeInfo(average)

  return { average, formatted, totalPoints, badge, tone }
}
