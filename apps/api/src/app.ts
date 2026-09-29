import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';

import type { AppConfig } from './core/config/env';
import { createPrismaClient } from './core/db/prisma';
import { ServiceUnavailableError } from './core/errors/app-error';
import { handleError, handleNotFound } from './core/errors/error-handler';
import {
  createMemoryRateLimiter,
  createWorkersRateLimiter,
  type RateLimiter,
  type WorkersRateLimitBinding,
  type WorkersRateLimitPeriod,
} from './core/security/rate-limiter';
import { createAdminIngestRoutes } from './features/admin-ingest/admin-ingest.routes';
import { createProvidersService, type ProvidersService } from './features/admin-ingest/providers.service';
import { createSubmissionsService, type SubmissionsService } from './features/admin-ingest/submissions.service';
import { createHealthRoutes } from './features/health/health.routes';
import { createHealthService, type HealthService } from './features/health/health.service';
import type { PipelineRunner } from './features/ingest/pipeline/pipeline.types';
import { createPipelineRunner } from './features/ingest/pipeline/run-pipeline';
import { createPostcodeLookup } from './features/ingest/providers/postcode-lookup';
import type {
  ApplicationRepository,
  ProviderRepository,
  SubmissionRepository,
} from './features/ingest/repositories/ingest.repositories';
import { PrismaApplicationRepository } from './features/ingest/repositories/prisma-application.repository';
import { PrismaProviderRepository } from './features/ingest/repositories/prisma-provider.repository';
import { PrismaSubmissionRepository } from './features/ingest/repositories/prisma-submission.repository';
import { createApiKeyAuthService, type ApiKeyAuthService } from './features/ingest-api/api-key-auth.service';
import {
  INGEST_IP_LIMIT,
  INGEST_KEY_LIMIT,
  INGEST_RATE_LIMIT_PERIOD_SECONDS,
} from './features/ingest-api/ingest-api.constants';
import { createIngestRoutes } from './features/ingest-api/ingest.routes';
import { createIngestService, type IngestService } from './features/ingest-api/ingest.service';
import { createDocumentExtractService } from './features/intake-api/document-extract.service';
import type { DocumentExtractor } from './features/intake-api/document-extractor.types';
import { INTAKE_IP_LIMIT, INTAKE_RATE_LIMIT_PERIOD_SECONDS } from './features/intake-api/intake-api.constants';
import { createIntakeRoutes, type IntakeRouteDeps } from './features/intake-api/intake.routes';
import { createIntakeService } from './features/intake-api/intake.service';
import { createLayeredDocumentExtractor } from './features/intake-api/extraction/layered-document-extractor';
import { createPaddleOcrClient } from './features/intake-api/extraction/paddle-ocr.client';
import { readPdfWords } from './features/intake-api/extraction/pdf-words.reader';
import { PrismaIntakeSettingsRepository } from './features/intake-settings/intake-settings.repository';
import { createIntakeSettingsRoutes } from './features/intake-settings/intake-settings.routes';
import { createResendEmailSender, type EmailSender } from './features/notifications/email-sender';
import { PrismaNotificationSettingsRepository } from './features/notifications/notification-settings.repository';
import { createNotificationSettingsRoutes } from './features/notifications/notification-settings.routes';
import {
  createNotificationSettingsService,
  type NotificationSettingsService,
} from './features/notifications/notification-settings.service';
import { createSubmissionNotifier } from './features/notifications/submission-notifier';
import {
  createIntakeSettingsService,
  type IntakeSettingsService,
} from './features/intake-settings/intake-settings.service';

/** Everything the ingest and admin routes need. Absent when no database is configured. */
export interface IngestFeatureDeps {
  ingestService: IngestService;
  apiKeyAuth: ApiKeyAuthService;
  ipLimiter: RateLimiter;
  keyLimiter: RateLimiter;
  providersService: ProvidersService;
  submissionsService: SubmissionsService;
}

export interface AppDeps {
  config: AppConfig;
  healthService: HealthService;
  /** null → /api/v1/ingest and /api/admin answer 503 DATABASE_UNAVAILABLE. */
  ingest: IngestFeatureDeps | null;
  /** Always present: extract needs no database; POST /api/v1/intake answers 503 without one. */
  intake: IntakeRouteDeps;
  /** Admin → General. Without a database it serves the defaults and refuses updates. */
  intakeSettings: IntakeSettingsService;
  /** Admin → General notification addresses. Without a database it reads as empty and refuses updates. */
  notificationSettings: NotificationSettingsService;
  /** Releases connections. The Worker calls it after each request (see worker.ts). */
  dispose?: () => Promise<void>;
}

/** Worker-only bindings. On Node both are absent and in-memory limiters are used. */
export interface RuntimeBindings {
  ingestKeyLimiter?: WorkersRateLimitBinding;
  ingestIpLimiter?: WorkersRateLimitBinding;
  intakeIpLimiter?: WorkersRateLimitBinding;
}

export interface IngestFeatureParts {
  submissions: SubmissionRepository;
  applications: ApplicationRepository;
  providers: ProviderRepository;
  pipeline: PipelineRunner;
  ipLimiter: RateLimiter;
  keyLimiter: RateLimiter;
  now: () => Date;
}

/** Wires the ingest services from repositories. Tests call this with in-memory fakes. */
export function buildIngestDeps(parts: IngestFeatureParts): IngestFeatureDeps {
  const { submissions, applications, providers, pipeline, now } = parts;
  return {
    ingestService: createIngestService({ submissions, pipeline }),
    apiKeyAuth: createApiKeyAuthService({ providers, now }),
    ipLimiter: parts.ipLimiter,
    keyLimiter: parts.keyLimiter,
    providersService: createProvidersService({ providers, now }),
    submissionsService: createSubmissionsService({ submissions, applications, pipeline }),
  };
}

export interface IntakeFeatureParts {
  intakeIpLimiter: RateLimiter;
  documentExtractor: DocumentExtractor;
  settings: IntakeSettingsService;
  /** The ingest store and pipeline, or null when no database is configured. */
  store: { submissions: SubmissionRepository; pipeline: PipelineRunner } | null;
  now: () => Date;
}

/** Wires the public intake endpoints. Tests call this with in-memory fakes. */
export function buildIntakeDeps(parts: IntakeFeatureParts): IntakeRouteDeps {
  const { store, now } = parts;
  return {
    intakeIpLimiter: parts.intakeIpLimiter,
    documentExtractService: createDocumentExtractService({ extractor: parts.documentExtractor, settings: parts.settings }),
    settings: parts.settings,
    intakeService: store ? createIntakeService({ submissions: store.submissions, pipeline: store.pipeline, now }) : null,
  };
}

function buildLimiter(
  binding: WorkersRateLimitBinding | undefined,
  limit: number,
  periodSeconds: WorkersRateLimitPeriod = INGEST_RATE_LIMIT_PERIOD_SECONDS,
): RateLimiter {
  return binding
    ? createWorkersRateLimiter(binding, periodSeconds)
    : createMemoryRateLimiter({ limit, periodSeconds });
}

/** Composition root: the only place that builds concrete services and repositories. */
export function buildDeps(config: AppConfig, runtime: RuntimeBindings = {}): AppDeps {
  const now = (): Date => new Date();
  const base = { config, healthService: createHealthService() };
  const intakeParts = {
    intakeIpLimiter: buildLimiter(runtime.intakeIpLimiter, INTAKE_IP_LIMIT, INTAKE_RATE_LIMIT_PERIOD_SECONDS),
    // Layer 1 reads PDFs' own text; layer 2 is the optional local PaddleOCR sidecar (FEAT-005).
    documentExtractor: createLayeredDocumentExtractor({
      readPdfWords,
      ocr: config.ocrSidecarUrl
        ? createPaddleOcrClient({ baseUrl: config.ocrSidecarUrl, timeoutMs: config.ocrSidecarTimeoutMs })
        : null,
    }),
    now,
  };
  const emailSender = buildEmailSender(config);
  const emailConfigured = emailSender !== null;

  if (!config.databaseUrl) {
    const intakeSettings = createIntakeSettingsService({ repository: null });
    return {
      ...base,
      ingest: null,
      intake: buildIntakeDeps({ ...intakeParts, settings: intakeSettings, store: null }),
      intakeSettings,
      notificationSettings: createNotificationSettingsService({ repository: null, emailConfigured }),
    };
  }

  // One client per app instance. Node builds the app once; the Worker builds it per request,
  // because Workers cannot reuse a TCP connection opened during a different request.
  const prisma = createPrismaClient(config.databaseUrl);
  const intakeSettings = createIntakeSettingsService({ repository: new PrismaIntakeSettingsRepository(prisma) });
  const submissions = new PrismaSubmissionRepository(prisma);
  const applications = new PrismaApplicationRepository(prisma);
  const notificationSettings = createNotificationSettingsService({
    repository: new PrismaNotificationSettingsRepository(prisma),
    emailConfigured,
  });
  const pipeline = createPipelineRunner({
    submissions,
    stepDeps: {
      lookupPostcode: createPostcodeLookup({ baseUrl: config.postcodesIoBaseUrl }),
      applications,
      now,
      notifier: createSubmissionNotifier({
        settings: notificationSettings,
        submissions,
        sender: emailSender,
        adminBaseUrl: config.adminBaseUrl,
      }),
    },
  });

  return {
    ...base,
    ingest: buildIngestDeps({
      submissions,
      applications,
      providers: new PrismaProviderRepository(prisma),
      pipeline,
      ipLimiter: buildLimiter(runtime.ingestIpLimiter, INGEST_IP_LIMIT),
      keyLimiter: buildLimiter(runtime.ingestKeyLimiter, INGEST_KEY_LIMIT),
      now,
    }),
    intake: buildIntakeDeps({ ...intakeParts, settings: intakeSettings, store: { submissions, pipeline } }),
    intakeSettings,
    notificationSettings,
    dispose: () => prisma.$disconnect(),
  };
}

/** The Resend sender, or null when the key or the sender address is missing (emails are then skipped). */
function buildEmailSender(config: AppConfig): EmailSender | null {
  if (!config.resendApiKey || !config.resendFromEmail) return null;
  return createResendEmailSender({ apiKey: config.resendApiKey, from: config.resendFromEmail });
}

function databaseUnavailable(_c: Context): never {
  throw new ServiceUnavailableError('DATABASE_UNAVAILABLE', 'The database is not configured');
}

/** Runtime-agnostic app. `server.ts` runs it on Node, `worker.ts` on Cloudflare. */
export function createApp(deps: AppDeps): Hono {
  const app = new Hono();

  app.use('/api/*', cors({ origin: deps.config.allowedOrigins, credentials: true }));

  app.get('/', (c) => c.text('Hello, world'));
  app.route('/api/health', createHealthRoutes(deps.healthService));
  app.route('/api/v1/intake', createIntakeRoutes(deps.intake));
  // Before the /api/admin/* fallback below, so settings still read (as defaults) without a database.
  app.route('/api/admin/settings/intake', createIntakeSettingsRoutes(deps.intakeSettings));
  app.route('/api/admin/settings/notifications', createNotificationSettingsRoutes(deps.notificationSettings));

  if (deps.ingest) {
    app.route('/api/v1/ingest', createIngestRoutes(deps.ingest));
    app.route('/api/admin', createAdminIngestRoutes(deps.ingest));
  } else {
    app.all('/api/v1/ingest', databaseUnavailable);
    app.all('/api/v1/ingest/*', databaseUnavailable);
    app.all('/api/admin/*', databaseUnavailable);
  }

  app.notFound(handleNotFound);
  app.onError(handleError);

  return app;
}
