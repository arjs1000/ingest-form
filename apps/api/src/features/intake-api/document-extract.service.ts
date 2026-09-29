import { extractResultDtoSchema, intakeUploadRules, type DocumentType, type ExtractResultDto } from '@ingest-form/shared';

import { PayloadTooLargeError, UnsupportedMediaTypeError } from '../../core/errors/app-error';
import { detectFileType } from '../../core/security/file-type';
import type { IntakeSettingsService } from '../intake-settings/intake-settings.service';
import type { DocumentExtractor } from './document-extractor.types';

export interface ExtractInput {
  bytes: Uint8Array;
  documentType: DocumentType;
}

export interface DocumentExtractService {
  /** Checks the file's real type and size against Admin → General, then returns the fields found. Nothing is stored. */
  extract(input: ExtractInput): Promise<ExtractResultDto>;
}

export interface DocumentExtractServiceDeps {
  extractor: DocumentExtractor;
  settings: Pick<IntakeSettingsService, 'get'>;
}

export function createDocumentExtractService(deps: DocumentExtractServiceDeps): DocumentExtractService {
  return {
    async extract({ bytes, documentType }) {
      const rules = intakeUploadRules(await deps.settings.get());
      if (bytes.byteLength > rules.maxBytes) throw new PayloadTooLargeError(rules.sizeMessage);
      const mimeType = detectFileType(bytes);
      if (!mimeType || !rules.mimeTypes.includes(mimeType)) throw new UnsupportedMediaTypeError(rules.typeMessage);

      const result = await deps.extractor.extractDocumentFields(
        { bytes, mimeType, sizeBytes: bytes.byteLength },
        documentType,
      );
      return extractResultDtoSchema.parse({ documentType, extractor: result.extractor, fields: result.fields });
    },
  };
}
