# Deploying the API: Cloudflare Workers (default) and AWS Lambda (alternative)

The API is built so the deployment target is a thin adapter. `apps/api/src/app.ts` exports
`createApp(deps)`, which knows nothing about the runtime. Each target gets a small entry file.

| Entry | Runtime | Status |
|-------|---------|--------|
| `src/server.ts` | Node (local dev) | In place |
| `src/worker.ts` | Cloudflare Workers | In place, **default production target** |
| `src/lambda.ts` | AWS Lambda | Not created. Steps below. |

## Why Workers is the default

- **Free tier**: 100,000 requests per day, no card needed, no idle cost.
- No cold-start tuning, global by default, and Wrangler is already a dependency.
- Hono is built for the `fetch` handler model Workers uses.

Limits to keep in mind: 10 ms CPU per request on the free plan (I/O wait does not count), 3 MB
compressed bundle on free (10 MB paid), 100 MB request body. File bytes never pass through the API
(presigned URLs), so the body limit does not matter for uploads.

## Cloudflare Workers setup (default path)

```bash
cd apps/api
pnpm exec wrangler login
pnpm exec wrangler secret put DATABASE_URL        # Neon connection string
# Edit wrangler.jsonc "vars": set ALLOWED_ORIGINS to the deployed web origin
pnpm run deploy:worker                             # wrangler deploy
```

- `wrangler.jsonc` enables `nodejs_compat`, which Prisma's driver adapters need.
- Local parity check: put secrets in `apps/api/.dev.vars`, then `pnpm dev:worker` (port 8304).
- **Prisma note:** the client is generated with the default `nodejs` runtime. Prisma's docs say to
  use `runtime = "workerd"` for Workers. Before the first DB-backed feature ships, verify queries on
  `wrangler dev` and switch the generator runtime if needed (see `ai-context/tracking/PROGRESS.md`
  gotchas).
- Use the Neon adapter (`@prisma/adapter-neon`) in the cloud. `createPrismaClient()` picks it for any
  `*.neon.tech` host.

## When to choose AWS Lambda instead

- **Compliance.** If the product must be HIPAA-compliant, you need a Business Associate Agreement
  (BAA) with every provider that stores or processes patient data. AWS signs BAAs for
  HIPAA-eligible services (Lambda, S3, API Gateway, CloudWatch) through AWS Artifact, on any account.
  Cloudflare's BAA availability depends on plan (unverified; check with Cloudflare sales before
  relying on it). Neon's BAA also needs checking for the chosen plan.
- You need longer execution time or more memory than Workers allows.
- You want uploads on S3 next to the API in one AWS account.

Cost: Lambda's free tier (1M requests and 400,000 GB-seconds per month) covers early use; API
Gateway HTTP APIs cost about $1 per million requests after the first 12 months.

## AWS Lambda setup

### 1. Add the Lambda entry

```ts
// apps/api/src/lambda.ts
import { handle } from 'hono/aws-lambda';

import { buildDeps, createApp } from './app.js';
import { loadConfig } from './core/config/env.js';

const app = createApp(buildDeps(loadConfig(process.env)));

export const handler = handle(app);
```

Nothing else in `src/` changes. This is the payoff of keeping runtime code out of `createApp`.

### 2. Pick a deploy tool

Serverless Framework v4 is the familiar option.
v4 needs a free Serverless account login; organisations over $2M revenue pay.

```yaml
# apps/api/serverless.yml
service: ingest-form-api
frameworkVersion: '4'

provider:
  name: aws
  runtime: nodejs22.x
  region: eu-west-2            # London. Pick the region your compliance decision requires.
  architecture: arm64
  memorySize: 1024
  timeout: 29
  environment:
    NODE_ENV: production
    ALLOWED_ORIGINS: ${ssm:/ingest-form/prod/allowed-origins}
    DATABASE_URL: ${ssm:/ingest-form/prod/database-url}

functions:
  api:
    handler: src/lambda.handler
    events:
      - httpApi: '*'

build:
  esbuild:
    bundle: true
    minify: true
    format: esm
    outputFileExtension: .mjs
```

Store secrets in SSM Parameter Store as `SecureString`:

```bash
aws ssm put-parameter --name /ingest-form/prod/database-url --type SecureString --value '<neon url>'
```

Then:

```bash
cd apps/api
pnpm add -D serverless
pnpm exec serverless deploy --stage prod
```

(SST is the alternative if you want infrastructure as TypeScript. Not evaluated here.)

### 3. Prisma on Lambda

- Keep the generator at `runtime = "nodejs"` (the current setting). Prisma 7 has no Rust engine
  binary, so there is no `binaryTargets`.
- Use `@prisma/adapter-neon` for Neon, or `@prisma/adapter-pg` with an RDS Proxy if the database
  moves into AWS.
- Build the client once per container, at module scope in `lambda.ts` (as above), not per request.

### 4. Uploads on S3 instead of R2

- Private bucket, block all public access, SSE-S3 or SSE-KMS encryption, versioning on.
- Presigned PUT/GET with `@aws-sdk/s3-request-presigner` 
- Give the Lambda role `s3:PutObject` / `s3:GetObject` on that bucket only.
- R2 speaks the S3 API, so the same presigning code works against either with a different endpoint.


## Web app

The web app deploys separately to static hosting on either path: Cloudflare Pages / Workers static
assets, or S3 + CloudFront. Set `VITE_API_URL` to the API origin at build time.
