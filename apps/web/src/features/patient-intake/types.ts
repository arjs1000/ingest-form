import type { DocumentType, IngestPayload } from '@ingest-form/shared';

/**
 * Body of POST /api/v1/intake: the ingest payload, except the application reference may be
 * left out (the server then generates one).
 */
export type IntakePayload = Omit<IngestPayload, 'application_reference'> & { application_reference?: string };

export interface ExtractVariables {
  file: File;
  documentType: DocumentType;
}
