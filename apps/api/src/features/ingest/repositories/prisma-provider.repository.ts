import { Prisma, type PrismaClient } from '#prisma';

import { ConflictError, NotFoundError } from '../../../core/errors/app-error';
import type {
  ApiKeyRecord,
  ApiKeyWithProvider,
  NewApiKey,
  ProviderRecord,
  ProviderRepository,
} from './ingest.repositories';

type ProviderWithKeys = Prisma.IngestProviderGetPayload<{ include: { keys: true } }>;

const KEYS_NEWEST_FIRST = { orderBy: { createdAt: 'desc' } } as const;

function hasCode(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function toKeyRecord(key: Prisma.IngestApiKeyModel): ApiKeyRecord {
  return {
    id: key.id,
    providerId: key.providerId,
    label: key.label,
    prefix: key.prefix,
    keyHash: key.keyHash,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    lastUsedAt: key.lastUsedAt,
    revokedAt: key.revokedAt,
  };
}

function toProviderRecord(provider: ProviderWithKeys): ProviderRecord {
  return {
    id: provider.id,
    name: provider.name,
    createdAt: provider.createdAt,
    keys: provider.keys.map(toKeyRecord),
  };
}

export class PrismaProviderRepository implements ProviderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<ProviderRecord[]> {
    const providers = await this.prisma.ingestProvider.findMany({
      include: { keys: KEYS_NEWEST_FIRST },
      orderBy: { createdAt: 'desc' },
    });
    return providers.map(toProviderRecord);
  }

  async findById(id: string): Promise<ProviderRecord | null> {
    const provider = await this.prisma.ingestProvider.findUnique({ where: { id }, include: { keys: KEYS_NEWEST_FIRST } });
    return provider ? toProviderRecord(provider) : null;
  }

  async create(name: string): Promise<ProviderRecord> {
    // The unique index is case-sensitive; names are compared case-insensitively, as the in-memory fake does.
    const existing = await this.prisma.ingestProvider.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) throw new ConflictError(`A provider named "${name}" already exists`);
    try {
      const provider = await this.prisma.ingestProvider.create({ data: { name }, include: { keys: true } });
      return toProviderRecord(provider);
    } catch (error) {
      if (hasCode(error, 'P2002')) throw new ConflictError(`A provider named "${name}" already exists`);
      throw error;
    }
  }

  async createKey(input: NewApiKey): Promise<ApiKeyRecord> {
    try {
      return toKeyRecord(await this.prisma.ingestApiKey.create({ data: input }));
    } catch (error) {
      if (hasCode(error, 'P2003')) throw new NotFoundError(`Provider ${input.providerId} not found`);
      throw error;
    }
  }

  async findKeyByHash(keyHash: string): Promise<ApiKeyWithProvider | null> {
    const key = await this.prisma.ingestApiKey.findUnique({
      where: { keyHash },
      include: { provider: { select: { name: true } } },
    });
    return key ? { ...toKeyRecord(key), providerName: key.provider.name } : null;
  }

  async findKeyById(id: string): Promise<ApiKeyRecord | null> {
    const key = await this.prisma.ingestApiKey.findUnique({ where: { id } });
    return key ? toKeyRecord(key) : null;
  }

  async touchKey(id: string, usedAt: Date): Promise<void> {
    // updateMany does not throw when the key vanished between auth and touch.
    await this.prisma.ingestApiKey.updateMany({ where: { id }, data: { lastUsedAt: usedAt } });
  }

  async revokeKey(id: string, revokedAt: Date): Promise<ApiKeyRecord> {
    // Only the first revocation sets the timestamp, so revoking twice is harmless.
    await this.prisma.ingestApiKey.updateMany({ where: { id, revokedAt: null }, data: { revokedAt } });
    const key = await this.prisma.ingestApiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundError(`API key ${id} not found`);
    return toKeyRecord(key);
  }
}
