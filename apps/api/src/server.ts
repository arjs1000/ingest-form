import { existsSync } from 'node:fs';

import { serve } from '@hono/node-server';

import { buildDeps, createApp } from './app';
import { loadConfig } from './core/config/env';

// Local dev entry. Env lives in the repo root .env, shared by every app.
const rootEnv = new URL('../../../.env', import.meta.url);
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const config = loadConfig(process.env);
const app = createApp(buildDeps(config));

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`[api] listening on http://localhost:${info.port}`);
});
