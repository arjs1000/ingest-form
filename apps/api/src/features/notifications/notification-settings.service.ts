import {
  EMPTY_NOTIFICATION_SETTINGS,
  type NotificationSettingsDto,
  type NotificationSettingsInput,
} from '@ingest-form/shared';

import { ServiceUnavailableError } from '../../core/errors/app-error';
import type { NotificationSettingsRepository } from './notification-settings.repository';

export interface NotificationSettingsService {
  /** The saved addresses (or none) and whether Resend is configured. */
  get(): Promise<NotificationSettingsDto>;
  update(settings: NotificationSettingsInput): Promise<NotificationSettingsDto>;
}

export interface NotificationSettingsServiceDeps {
  /** null when no database is configured: reads return no addresses, updates answer 503. */
  repository: NotificationSettingsRepository | null;
  /** RESEND_API_KEY and RESEND_FROM_EMAIL are both set. Reported to the admin page, never the key. */
  emailConfigured: boolean;
}

export function createNotificationSettingsService(deps: NotificationSettingsServiceDeps): NotificationSettingsService {
  const { repository, emailConfigured } = deps;
  return {
    async get() {
      const saved = (await repository?.find()) ?? EMPTY_NOTIFICATION_SETTINGS;
      return { ...saved, emailConfigured };
    },

    async update(settings) {
      if (!repository) throw new ServiceUnavailableError('DATABASE_UNAVAILABLE', 'The database is not configured');
      return { ...(await repository.save(settings)), emailConfigured };
    },
  };
}
