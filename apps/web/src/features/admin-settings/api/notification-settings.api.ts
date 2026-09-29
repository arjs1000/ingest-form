import {
  apiSuccessSchema,
  notificationSettingsDtoSchema,
  type NotificationSettingsDto,
  type NotificationSettingsInput,
} from '@ingest-form/shared';

import { apiGet, apiPut } from '@/core/lib/api-client';

const NOTIFICATION_SETTINGS_ENDPOINT = '/api/admin/settings/notifications';
const settingsEnvelope = apiSuccessSchema(notificationSettingsDtoSchema);

export async function fetchNotificationSettings(): Promise<NotificationSettingsDto> {
  return (await apiGet(NOTIFICATION_SETTINGS_ENDPOINT, settingsEnvelope)).data;
}

export async function saveNotificationSettings(settings: NotificationSettingsInput): Promise<NotificationSettingsDto> {
  return (await apiPut(NOTIFICATION_SETTINGS_ENDPOINT, settings, settingsEnvelope)).data;
}
