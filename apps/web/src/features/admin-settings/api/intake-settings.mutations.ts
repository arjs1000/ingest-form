import { mutationOptions, type QueryClient } from '@tanstack/react-query';

import { saveIntakeSettings } from './intake-settings.api';
import { intakeSettingsKeys } from './intake-settings.queries';

export function saveIntakeSettingsMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...intakeSettingsKeys.all, 'save'],
    mutationFn: saveIntakeSettings,
    onSuccess: (saved) => queryClient.setQueryData(intakeSettingsKeys.all, saved),
  });
}
