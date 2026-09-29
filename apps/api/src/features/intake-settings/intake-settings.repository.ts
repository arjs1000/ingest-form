import type { PrismaClient } from '#prisma';
import { intakeSettingsDtoSchema, type IntakeSettingsDto } from '@ingest-form/shared';

export interface IntakeSettingsRepository {
  /** The saved settings, or null before the first save. */
  find(): Promise<IntakeSettingsDto | null>;
  save(settings: IntakeSettingsDto): Promise<IntakeSettingsDto>;
}

/** The single settings row always has this id. */
const SETTINGS_ID = 'default';

export class PrismaIntakeSettingsRepository implements IntakeSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async find(): Promise<IntakeSettingsDto | null> {
    const row = await this.prisma.intakeSettings.findUnique({ where: { id: SETTINGS_ID } });
    // The column is a plain Int; parsing narrows it to the allowed sizes.
    return row ? intakeSettingsDtoSchema.parse({ acceptPhotos: row.acceptPhotos, maxFileSizeMb: row.maxFileSizeMb }) : null;
  }

  async save(settings: IntakeSettingsDto): Promise<IntakeSettingsDto> {
    await this.prisma.intakeSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...settings },
      update: settings,
    });
    return settings;
  }
}

/** Test fake with the same behaviour as the Prisma repository. */
export class InMemoryIntakeSettingsRepository implements IntakeSettingsRepository {
  private settings: IntakeSettingsDto | null = null;

  async find(): Promise<IntakeSettingsDto | null> {
    return this.settings;
  }

  async save(settings: IntakeSettingsDto): Promise<IntakeSettingsDto> {
    this.settings = { ...settings };
    return this.settings;
  }
}
