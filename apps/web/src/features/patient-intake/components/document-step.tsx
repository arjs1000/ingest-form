import {
  DEFAULT_INTAKE_SETTINGS,
  DOCUMENT_TYPE_TITLES,
  DOCUMENT_TYPES,
  intakeUploadRules,
  type DocumentType,
  type IntakeUploadRules,
} from '@ingest-form/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { IBackBar } from '@/core/components/IBackBar';
import { IButton } from '@/core/components/IButton';
import { IContainer } from '@/core/components/IContainer';
import { IFileUpload } from '@/core/components/IFileUpload';
import { IPageHeader } from '@/core/components/IPageHeader';
import { IRadios } from '@/core/components/IRadios';
import { IStepProgress } from '@/core/components/IStepProgress';
import { IText } from '@/core/components/IText';
import { ApiRequestError } from '@/core/lib/api-client';

import { extractDocumentMutationOptions } from '../api/intake.mutations';
import { uploadSettingsQueryOptions } from '../api/intake.queries';
import { INTAKE_TOTAL_STEPS } from '../constants';
import { useIntakeDraftStore } from '../store/intake-draft.store';
import { countExtractedDetails } from '../utils/from-extracted-fields';

const DOCUMENT_OPTIONS = DOCUMENT_TYPES.map((value) => ({ value, label: DOCUMENT_TYPE_TITLES[value] }));

/** Plain-English reason an upload failed. Never includes anything from the document. */
function uploadErrorMessage(error: unknown, rules: IntakeUploadRules): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 413) return rules.sizeMessage;
    if (error.status === 415) return rules.typeMessage;
    if (error.status === 429) return 'Too many uploads. Wait a minute, then try again';
  }
  return "We couldn't read your document";
}

/** Step 1: which document it is, then the upload. The API reads the document and returns the details it found. */
export function DocumentStep() {
  const navigate = useNavigate();
  const documentType = useIntakeDraftStore((s) => s.documentType);
  const extraction = useIntakeDraftStore((s) => s.extraction);
  const setDocumentType = useIntakeDraftStore((s) => s.setDocumentType);
  const setExtraction = useIntakeDraftStore((s) => s.setExtraction);
  const extract = useMutation(extractDocumentMutationOptions());
  // Admin → General. If the settings can't load, the defaults apply here and the API still enforces the real ones.
  const uploadSettings = useQuery(uploadSettingsQueryOptions);
  const rules = intakeUploadRules(uploadSettings.data ?? DEFAULT_INTAKE_SETTINGS);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Radios only: react-hook-form restores the checked option when the person comes back to this step.
  const { register } = useForm<{ documentType: DocumentType | null }>({ defaultValues: { documentType } });

  const processFile = async (file: File) => {
    if (!documentType) throw new Error('Choose which document you are uploading');
    setUploadError(null);
    try {
      const result = await extract.mutateAsync({ file, documentType });
      setExtraction(result, file.name);
    } catch (error) {
      const message = uploadErrorMessage(error, rules);
      setUploadError(message);
      throw new Error(message);
    }
  };

  const continueWithoutDocument = () => {
    setExtraction(null);
    void navigate({ to: '/patient-upload/details' });
  };

  const detailsFound = extraction ? countExtractedDetails(extraction.fields) : 0;

  return (
    <>
      <IBackBar>
        <Link to="/patient-upload">Back</Link>
      </IBackBar>
      <IContainer className="flex flex-col gap-8 pt-8 md:pt-12">
        <IPageHeader
          eyebrow={<IStepProgress current={1} total={INTAKE_TOTAL_STEPS} label="Your document" />}
          title="Upload your document"
          description="We'll read your details from it, so you only need to check them."
        />

        <div className="flex max-w-2xl flex-col gap-8">
          <IRadios
            name="documentType"
            legend="Which document are you uploading?"
            options={DOCUMENT_OPTIONS}
            inputProps={register('documentType', {
              onChange: (event: { target: { value: DocumentType } }) => {
                setDocumentType(event.target.value);
                setUploadError(null);
                extract.reset();
              },
            })}
          />

          <div className="flex flex-col gap-3">
            <IFileUpload
              // A new document type, or new limits, starts a new upload.
              key={`${documentType ?? 'none'}:${rules.hint}`}
              id="document-file"
              label="Your document"
              hint={documentType ? rules.hint : `Choose which document you are uploading first. ${rules.hint}.`}
              acceptedFileTypes={rules.mimeTypes}
              maxFileSize={rules.maxBytes}
              disabled={!documentType || uploadSettings.isPending}
              onProcessFile={processFile}
              onRemoveFile={() => {
                setExtraction(null);
                setUploadError(null);
              }}
            />

            {extract.isPending ? (
              // A PDF you typed into reads instantly; a photo or scan goes through OCR (~40s on a laptop CPU).
              <IText as="p" role="status" tone="secondary">
                Reading your document. A photo or scan can take up to a minute.
              </IText>
            ) : null}

            {extraction ? (
              <IText as="p" role="status" className="flex items-start gap-2">
                <CircleCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-action" />
                {detailsFound > 0
                  ? `We found ${detailsFound} ${detailsFound === 1 ? 'detail' : 'details'} in your document.`
                  : "We couldn't find any details. You can enter them on the next page."}
              </IText>
            ) : null}

            {uploadError ? (
              <div role="alert" className="flex flex-col gap-3 border-l-4 border-error pl-4">
                <IText as="p" weight="semibold" tone="error">
                  <span className="sr-only">Error: </span>
                  {uploadError}
                </IText>
                <IText as="p" tone="secondary">
                  Try again by choosing the file again, or continue and enter your details yourself.
                </IText>
                <IButton variant="secondary" onClick={continueWithoutDocument}>
                  Continue without the document
                </IButton>
              </div>
            ) : null}
          </div>

          <IButton
            disabled={!extraction}
            onClick={() => void navigate({ to: '/patient-upload/details' })}
            className="self-start"
          >
            Continue
          </IButton>
        </div>
      </IContainer>
    </>
  );
}
