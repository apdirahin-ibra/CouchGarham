import { OFFICIAL_CLUB_RULES } from '../data/rules-data'
import { OFFICIAL_100_TIPS } from '../data/tips-data'
import { getDatabase } from '../db/connection.server'
import { clubSettings, players, scheduleEntries, tips } from '../db/schema'
import { provisionAdminAccount } from '../lib/auth.server'

export async function runDatabaseSeed() {
  // 1. Validate Admin Password requirement BEFORE connecting
  const adminUser = process.env.ADMIN_INITIAL_USERNAME || 'admin'
  const adminPass = process.env.ADMIN_INITIAL_PASSWORD
  const allowDemoSeed = process.env.ALLOW_DEMO_SEED === 'true'

  if (!adminPass && !allowDemoSeed) {
    throw new Error(
      'ADMIN_INITIAL_PASSWORD environment variable must be provided to seed the database safely. Set ADMIN_INITIAL_PASSWORD or set ALLOW_DEMO_SEED=true for isolated local test mode.',
    )
  }

  console.log('--- Starting Database Seed ---')
  const db = getDatabase()

  const effectivePassword = adminPass || 'DemoAdminSecretPass2026!'
  const forceReset = process.env.FORCE_RESET_ADMIN === 'true'

  console.log(`Provisioning Admin user (${adminUser})...`)
  const result = await provisionAdminAccount({
    username: adminUser,
    name: 'Maamulaha Kooxda (Coach)',
    password: effectivePassword,
    forceReset,
  })
  console.log(`✓ Admin provisioning: ${result.message}`)

  // 2. Seed Initial Roster if empty
  const existingPlayers = await db.select().from(players).limit(1)
  if (existingPlayers.length === 0) {
    console.log('Seeding initial club roster...')
    const initialPlayers = [
      {
        name: 'Axmed Cali',
        nickname: 'Goolhaye',
        jerseyNumber: 1,
        position: 'Goolhaye',
        whatsapp: '+252615551234',
      },
      {
        name: 'Maxamed Jaamac',
        nickname: 'Difaac',
        jerseyNumber: 4,
        position: 'Difaac',
        whatsapp: '+252615555678',
      },
      {
        name: 'Cabdullaahi Nuur',
        nickname: 'Khad',
        jerseyNumber: 8,
        position: 'Khad Dhexe',
        whatsapp: '+252615559012',
      },
      {
        name: 'Xasan Cabdi',
        nickname: 'Weerar',
        jerseyNumber: 9,
        position: 'Weerar',
        whatsapp: '+252615553456',
      },
      {
        name: 'Yaxye Cismaan',
        nickname: 'Garab',
        jerseyNumber: 11,
        position: 'Garab',
        whatsapp: '+252615557890',
      },
      {
        name: 'Cumar Faarax',
        nickname: 'Dhagacad',
        jerseyNumber: 3,
        position: 'Difaac Midig',
        whatsapp: '+252615551122',
      },
      {
        name: 'Khaalid Shiikh',
        nickname: 'Khad',
        jerseyNumber: 7,
        position: 'Khad Weerar',
        whatsapp: '+252615553344',
      },
      {
        name: 'Mustafa Cilmi',
        nickname: 'Dheere',
        jerseyNumber: 10,
        position: 'Khad Dhexe',
        whatsapp: '+252615555566',
      },
      {
        name: 'Saahid Yuusuf',
        nickname: 'Bir',
        jerseyNumber: 14,
        position: 'Difaac Dhexe',
        whatsapp: '+252615557788',
      },
    ]

    for (const p of initialPlayers) {
      await db.insert(players).values(p)
    }
    console.log(`✓ Seeded ${initialPlayers.length} players.`)
  }

  // 3. Seed Initial Schedules if empty
  const existingSchedules = await db.select().from(scheduleEntries).limit(1)
  if (existingSchedules.length === 0) {
    console.log('Seeding weekly training schedules...')
    await db.insert(scheduleEntries).values([
      {
        dayName: 'Isniin',
        timeText: '4:30 PM - 6:30 PM',
        place: 'Garoonka Weyn ee Degmada',
      },
      {
        dayName: 'Arbaco',
        timeText: '4:30 PM - 6:30 PM',
        place: 'Garoonka Weyn ee Degmada',
      },
      {
        dayName: 'Jimco',
        timeText: '4:00 PM - 6:00 PM',
        place: 'Garoonka Jaamacadaha (Kulanka Tartanka)',
      },
    ])
    console.log('✓ Seeded schedules.')
  }

  // 4. Seed Club Settings & Rules if empty
  const existingSettings = await db.select().from(clubSettings).limit(1)
  if (existingSettings.length === 0) {
    console.log('Seeding club settings and rules...')
    await db.insert(clubSettings).values({
      announcementText:
        'Kusoo dhowaada Best Official App. Dhammaan ciyaartooyda waxaa la ogeysiinayaa in tababarka la ilaaliyo.',
      rulesText: OFFICIAL_CLUB_RULES,
    })
    console.log('✓ Seeded club settings.')
  }

  // 5. Seed Initial Tips (Waano) if empty
  const existingTips = await db.select().from(tips).limit(1)
  if (existingTips.length === 0) {
    console.log('Seeding 100 official football tips...')
    await db.insert(tips).values(
      OFFICIAL_100_TIPS.map((tip) => ({
        text: tip.text,
        sortOrder: tip.sortOrder,
      })),
    )
    console.log(`✓ Seeded ${OFFICIAL_100_TIPS.length} tips.`)
  }

  console.log('--- Database Seed Complete! ---')
}

// Auto-run only when directly invoked via CLI runner and not during unit tests
if (
  !process.env.VITEST &&
  (process.env.npm_lifecycle_event === 'db:seed' ||
    process.argv[1]?.includes('seed.ts'))
) {
  runDatabaseSeed()
    .then(() => {
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seed execution halted:', err.message)
      process.exit(1)
    })
}
