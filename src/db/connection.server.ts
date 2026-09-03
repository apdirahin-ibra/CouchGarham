import '@tanstack/react-start/server-only'

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'

import { getServerEnv } from '../lib/env.server'

const DATABASE_CONNECTION_KEY = Symbol.for('couch-garham.database-connection')

/**
 * Keep the application-side pool deliberately small. Supabase's pooler owns
 * database connection fan-out; each warm serverless instance only needs one
 * client connection at a time.
 */
const databaseClientOptions = {
  prepare: false,
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
} as const

type DatabaseConnection = {
  client: Sql
  db: PostgresJsDatabase
}

type DatabaseRuntime = typeof globalThis & {
  [DATABASE_CONNECTION_KEY]?: DatabaseConnection
}

const databaseRuntime = globalThis as DatabaseRuntime

function createDatabaseConnection(): DatabaseConnection {
  const { DATABASE_URL } = getServerEnv().secrets
  const client = postgres(DATABASE_URL, databaseClientOptions)

  return {
    client,
    db: drizzle({ client }),
  }
}

function getDatabaseConnection(): DatabaseConnection {
  databaseRuntime[DATABASE_CONNECTION_KEY] ??= createDatabaseConnection()

  return databaseRuntime[DATABASE_CONNECTION_KEY]
}

/**
 * Return the shared Drizzle database for the current warm server instance.
 * Creating this wrapper does not connect; postgres.js opens a connection only
 * when the first query is executed.
 */
export function getDatabase(): PostgresJsDatabase {
  return getDatabaseConnection().db
}

/**
 * Return the shared postgres.js client for transaction and lifecycle needs.
 * Product queries should normally use getDatabase().
 */
export function getDatabaseClient(): Sql {
  return getDatabaseConnection().client
}

/**
 * Close the client during explicit process/test teardown. Do not call this at
 * the end of a Vercel request because warm instances should reuse the client.
 */
export async function closeDatabaseConnection(): Promise<void> {
  const connection = databaseRuntime[DATABASE_CONNECTION_KEY]

  if (!connection) {
    return
  }

  delete databaseRuntime[DATABASE_CONNECTION_KEY]
  await connection.client.end({ timeout: 5 })
}
