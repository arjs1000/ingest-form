import { mutationOptions, type QueryClient } from '@tanstack/react-query';

import { saveNotificationSettings } from './notification-settings.api';
import { notificationSettingsKeys } from './notification-settings.queries';

export function saveNotificationSettingsMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: [...notificationSettingsKeys.all, 'save'],
    mutationFn: saveNotificationSettings,
    onSuccess: (saved) => queryClient.setQueryData(notificationSettingsKeys.all, saved),
  });
}
