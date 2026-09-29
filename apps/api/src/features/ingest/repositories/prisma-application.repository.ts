import type { TransformedForm } from '@ingest-form/shared';

import type { Prisma, PrismaClient } from '#prisma';

import { matchPerson } from '../duplicates/duplicate-rules';
import type { ApplicationRecord, ApplicationRepository } from './ingest.repositories';

type DbGender = Prisma.ApplicationModel['gender'];

const TO_DB_GENDER: Record<TransformedForm['gender'], DbGender> = {
  male: 'male',
  female: 'female',
  'prefer-not-to-say': 'prefer_not_to_say',
};

const FROM_DB_GENDER: Record<DbGender, TransformedForm['gender']> = {
  male: 'male',
  female: 'female',
  prefer_not_to_say: 'prefer-not-to-say',
};

/** 'YYYY-MM-DD' ↔ a UTC-midnight Date, so the DATE column never shifts by a timezone. */
function toDbDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toApplicationData(form: TransformedForm): Omit<Prisma.ApplicationUncheckedCreateInput, 'submissionId'> {
  return {
    sessionId: form.sessionId,
    applicationReference: form.applicationReference,
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    gender: TO_DB_GENDER[form.gender],
    dateOfBirth: toDbDate(form.dateOfBirth),
    phoneNumber: form.phoneNumber ?? null,
    mobileNumber: form.mobileNumber,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
    addressLine3: form.addressLine3 ?? null,
    postcode: form.postcode,
    country: form.country,
    longitude: form.longitude,
    latitude: form.latitude,
  };
}

function toApplicationRecord(row: Prisma.ApplicationModel): ApplicationRecord {
  return {
    id: row.id,
    submissionId: row.submissionId,
    sessionId: row.sessionId,
    applicationReference: row.applicationReference,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    gender: FROM_DB_GENDER[row.gender],
    dateOfBirth: fromDbDate(row.dateOfBirth),
    phoneNumber: row.phoneNumber ?? undefined,
    mobileNumber: row.mobileNumber,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    addressLine3: row.addressLine3 ?? undefined,
    postcode: row.postcode,
    country: row.country,
    longitude: row.longitude,
    latitude: row.latitude,
    createdAt: row.createdAt,
  };
}

export class PrismaApplicationRepository implements ApplicationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Upsert on the unique submissionId, so re-running persist replaces the row instead of adding one. */
  async upsertForSubmission(submissionId: string, form: TransformedForm): Promise<{ id: string }> {
    const data = toApplicationData(form);
    return this.prisma.application.upsert({
      where: { submissionId },
      create: { ...data, submissionId },
      update: data,
      select: { id: true },
    });
  }

  async findBySubmissionId(submissionId: string): Promise<ApplicationRecord | null> {
    const row = await this.prisma.application.findUnique({ where: { submissionId } });
    return row ? toApplicationRecord(row) : null;
  }

  /**
   * SQL form of duplicate-rules.ts matchPerson: same first + last name (case-insensitive) and the
   * same email (case-insensitive) or the same mobile (both stored in E.164). Earliest submission first.
   */
  async findEarliestSamePerson(
    submissionId: string,
    form: TransformedForm,
  ): Promise<{ submissionId: string; reason: 'same_person_email' | 'same_person_mobile' } | null> {
    const row = await this.prisma.application.findFirst({
      where: {
        submissionId: { not: submissionId },
        firstName: { equals: form.firstName.trim(), mode: 'insensitive' },
        lastName: { equals: form.lastName.trim(), mode: 'insensitive' },
        OR: [{ email: { equals: form.email.trim(), mode: 'insensitive' } }, { mobileNumber: form.mobileNumber.trim() }],
      },
      orderBy: [{ submission: { receivedAt: 'asc' } }, { submissionId: 'asc' }],
    });
    if (!row) return null;
    // Re-check in code so the reason (email before mobile) comes from the single rule definition.
    const reason = matchPerson(row, form);
    return reason ? { submissionId: row.submissionId, reason } : null;
  }
}
