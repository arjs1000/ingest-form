import type { Hono } from 'hono';

import { buildDeps, buildIngestDeps, buildIntakeDeps, createApp } from '../../../app';
import { loadConfig } from '../../../core/config/env';
import { apiKeyExpiry, generateApiKey } from '../../../core/security/api-key';
import { createMemoryRateLimiter } from '../../../core/security/rate-limiter';
import type { PipelineRunner } from '../../ingest/pipeline/pipeline.types';
import { createLayeredDocumentExtractor } from '../../intake-api/extraction/layered-document-extractor';
import type { OcrClient } from '../../intake-api/extraction/paddle-ocr.client';
import { readPdfWords } from '../../intake-api/extraction/pdf-words.reader';
import { InMemoryIntakeSettingsRepository } from '../../intake-settings/intake-settings.repository';
import { createIntakeSettingsService } from '../../intake-settings/intake-settings.service';
import { InMemoryNotificationSettingsRepository } from '../../notifications/notification-settings.repository';
import { createNotificationSettingsService } from '../../notifications/notification-settings.service';
import {
  InMemoryApplicationRepository,
  InMemoryProviderRepository,
  InMemorySubmissionRepository,
} from '../../ingest/repositories/in-memory.repositories';

/** A pipeline that always reports "completed". These specs test the HTTP layer, not the pipeline. */
const completedPipeline: PipelineRunner = {
  run: async (submissionId) => ({ submissionId, status: 'completed', failedStep: null, issues: [] }),
  rerun: async (submissionId) => ({ submissionId, status: 'completed', failedStep: null, issues: [] }),
  rerunFailedAt: async () => ({ requested: 0, completed: 0, failed: 0 }),
};

export interface IngestTestApp {
  app: Hono;
  submissions: InMemorySubmissionRepository;
  providers: InMemoryProviderRepository;
  /** Creates a provider and returns a fresh, active API key for it. */
  issueKey: () => Promise<string>;
  /** Moves the app's clock forward. */
  advanceDays: (days: number) => void;
}

/** The real app with in-memory repositories and a controllable clock. Also wires /api/v1/intake and the admin settings. */
export function createIngestTestApp(options: { requestsPerMinute?: number; ocr?: OcrClient } = {}): IngestTestApp {
  let currentTime = new Date('2026-09-27T12:00:00.000Z').getTime();
  const now = (): Date => new Date(currentTime);
  const limit = options.requestsPerMinute ?? 1000;
  const providers = new InMemoryProviderRepository(now);
  const applications = new InMemoryApplicationRepository(now);
  const submissions = new InMemorySubmissionRepository(
    now,
    (providerId) => providers.providerName(providerId),
    (submissionId) => applications.personFor(submissionId),
  );
  const intakeSettings = createIntakeSettingsService({ repository: new InMemoryIntakeSettingsRepository() });
  const app = createApp({
    ...buildDeps(loadConfig({ NODE_ENV: 'test' })),
    intakeSettings,
    notificationSettings: createNotificationSettingsService({
      repository: new InMemoryNotificationSettingsRepository(),
      emailConfigured: false,
    }),
    intake: buildIntakeDeps({
      intakeIpLimiter: createMemoryRateLimiter({ limit, periodSeconds: 60, now }),
      // The real PDF reader; OCR is a fake when a test passes one, otherwise off.
      documentExtractor: createLayeredDocumentExtractor({ readPdfWords, ocr: options.ocr ?? null }),
      settings: intakeSettings,
      store: { submissions, pipeline: completedPipeline },
      now,
    }),
    ingest: buildIngestDeps({
      submissions,
      applications,
      providers,
      pipeline: completedPipeline,
      ipLimiter: createMemoryRateLimiter({ limit, periodSeconds: 60, now }),
      keyLimiter: createMemoryRateLimiter({ limit, periodSeconds: 60, now }),
      now,
    }),
  });

  async function issueKey(): Promise<string> {
    const provider = await providers.create('Acme Health');
    const generated = await generateApiKey();
    await providers.createKey({
      providerId: provider.id,
      label: null,
      prefix: generated.prefix,
      keyHash: generated.hash,
      expiresAt: apiKeyExpiry(now()),
    });
    return generated.key;
  }

  return {
    app,
    submissions,
    providers,
    issueKey,
    advanceDays: (days) => {
      currentTime += days * 24 * 60 * 60 * 1000;
    },
  };
}
