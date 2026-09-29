import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

// '#prisma' is the Node client, or the workerd client when wrangler bundles the Worker
// (package.json "imports" conditions). The two are generated from the same schema.
import { PrismaClient } from '#prisma';

/**
 * Builds a Prisma client for the given connection string.
 * Neon hosts use the Neon serverless driver (works on Workers); anything else,
 * such as the local Docker Postgres, uses node-postgres.
 *
 * Only repositories import the client. Services receive repositories, never Prisma.
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  const isNeon = new URL(databaseUrl).hostname.endsWith('.neon.tech');
  const adapter = isNeon
    ? new PrismaNeon({ connectionString: databaseUrl })
    : new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export type { PrismaClient };
