import { existsSync } from 'node:fs';

import { defineConfig } from 'prisma/config';

// The root .env holds DATABASE_URL for every app. Absent in CI, where the var comes from the environment.
const rootEnv = new URL('../../.env', import.meta.url);
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
