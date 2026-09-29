import type { PrismaClient } from '#prisma';
import type { NotificationSettingsInput } from '@ingest-form/shared';

export interface NotificationSettingsRepository {
  /** The saved addresses, or null before the first save. */
  find(): Promise<NotificationSettingsInput | null>;
  save(settings: NotificationSettingsInput): Promise<NotificationSettingsInput>;
}

/** The single settings row always has this id. */
const SETTINGS_ID = 'default';

export class PrismaNotificationSettingsRepository implements NotificationSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async find(): Promise<NotificationSettingsInput | null> {
    const row = await this.prisma.notificationSettings.findUnique({ where: { id: SETTINGS_ID } });
    return row ? { successEmail: row.successEmail, failureEmail: row.failureEmail } : null;
  }

  async save(settings: NotificationSettingsInput): Promise<NotificationSettingsInput> {
    await this.prisma.notificationSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...settings },
      update: settings,
    });
    return settings;
  }
}

/** Test fake with the same behaviour as the Prisma repository. */
export class InMemoryNotificationSettingsRepository implements NotificationSettingsRepository {
  private settings: NotificationSettingsInput | null = null;

  async find(): Promise<NotificationSettingsInput | null> {
    return this.settings;
  }

  async save(settings: NotificationSettingsInput): Promise<NotificationSettingsInput> {
    this.settings = { ...settings };
    return this.settings;
  }
}
