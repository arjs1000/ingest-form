import { queryOptions } from '@tanstack/react-query';

import { fetchIntakeSettings } from './intake-settings.api';

export const intakeSettingsKeys = {
  all: ['admin-intake-settings'] as const,
};

export const intakeSettingsQueryOptions = queryOptions({
  queryKey: intakeSettingsKeys.all,
  queryFn: fetchIntakeSettings,
});
