import type { ExtractResultDto } from '@ingest-form/shared';
import { Code } from 'lucide-react';
import { useWatch, type Control } from 'react-hook-form';

import { IBadge } from '@/core/components/IBadge';
import { IButton } from '@/core/components/IButton';
import { ICodeBlock } from '@/core/components/ICodeBlock';
import { IHeading } from '@/core/components/IHeading';
import { ISheet, ISheetContent, ISheetDescription, ISheetTitle, ISheetTrigger } from '@/core/components/ISheet';
import { IText } from '@/core/components/IText';

import { INTAKE_ENDPOINT } from '../constants';
import type { PatientDetailsValues } from '../schemas/patient-details.schema';
import { toIngestPayload } from '../utils/to-ingest-payload';

export interface DeveloperDataSheetProps {
  control: Control<PatientDetailsValues>;
  sessionId: string;
  extraction: ExtractResultDto | null;
}

/**
 * "Developer tool": the exact JSON the form will POST, live as the person types, plus what the
 * document extraction returned. The one allowed overlay in the patient flow (design-patterns.md).
 */
export function DeveloperDataSheet({ control, sessionId, extraction }: DeveloperDataSheetProps) {
  // useWatch (not watch) keeps re-renders inside this component and works with the React Compiler.
  const values = useWatch({ control }) as PatientDetailsValues;
  const payload = toIngestPayload(values, { sessionId, applicationReference: extraction?.fields.application_reference });

  return (
    <ISheet>
      <ISheetTrigger asChild>
        <IButton variant="reverse">
          <Code aria-hidden="true" />
          View developer data
        </IButton>
      </ISheetTrigger>
      <ISheetContent>
        <div className="flex flex-col gap-2">
          <IBadge tone="info" className="self-start">
            Developer tool
          </IBadge>
          <ISheetTitle>Developer data</ISheetTitle>
          <ISheetDescription>The request this form sends, updated as you type.</ISheetDescription>
        </div>

        <section className="flex flex-col gap-2" aria-labelledby="dev-endpoint">
          <IHeading level={3} id="dev-endpoint">
            Endpoint
          </IHeading>
          <ICodeBlock code={`POST ${INTAKE_ENDPOINT}`} label="endpoint" />
        </section>

        <section className="flex flex-col gap-2" aria-labelledby="dev-payload">
          <IHeading level={3} id="dev-payload">
            Ingest JSON
          </IHeading>
          <ICodeBlock code={JSON.stringify(payload, null, 2)} label="ingest JSON" />
        </section>

        <section className="flex flex-col gap-2" aria-labelledby="dev-extraction">
          <IHeading level={3} id="dev-extraction">
            Document extraction
          </IHeading>
          {extraction ? (
            <ICodeBlock code={JSON.stringify(extraction, null, 2)} label="extraction result" />
          ) : (
            <IText as="p" tone="secondary">
              No document was read: the form started empty.
            </IText>
          )}
        </section>
      </ISheetContent>
    </ISheet>
  );
}
