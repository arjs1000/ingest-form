import { queryOptions } from '@tanstack/react-query';

import { fetchNotificationSettings } from './notification-settings.api';

export const notificationSettingsKeys = {
  all: ['admin-notification-settings'] as const,
};

export const notificationSettingsQueryOptions = queryOptions({
  queryKey: notificationSettingsKeys.all,
  queryFn: fetchNotificationSettings,
});
