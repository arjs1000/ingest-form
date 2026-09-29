import { DEFAULT_INTAKE_SETTINGS, type IntakeSettingsDto } from '@ingest-form/shared';

import { ServiceUnavailableError } from '../../core/errors/app-error';
import type { IntakeSettingsRepository } from './intake-settings.repository';

export interface IntakeSettingsService {
  /** The saved settings, or the defaults when none are saved (or there is no database). */
  get(): Promise<IntakeSettingsDto>;
  update(settings: IntakeSettingsDto): Promise<IntakeSettingsDto>;
}

export interface IntakeSettingsServiceDeps {
  /** null when no database is configured: reads return the defaults, updates answer 503. */
  repository: IntakeSettingsRepository | null;
}

export function createIntakeSettingsService({ repository }: IntakeSettingsServiceDeps): IntakeSettingsService {
  return {
    async get() {
      return (await repository?.find()) ?? DEFAULT_INTAKE_SETTINGS;
    },

    async update(settings) {
      if (!repository) throw new ServiceUnavailableError('DATABASE_UNAVAILABLE', 'The database is not configured');
      return repository.save(settings);
    },
  };
}
