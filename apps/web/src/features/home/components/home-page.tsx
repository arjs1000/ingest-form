import { Link } from '@tanstack/react-router';
import { ArrowRight, FileUp, Settings } from 'lucide-react';

import { ICard, ICardBody, ICardHeading, ICardLink } from '@/core/components/ICard';
import { IContainer } from '@/core/components/IContainer';

export function HomePage() {
  return (
    <IContainer className="flex flex-col gap-8 pt-8 md:gap-10 md:pt-12">
      <div className="flex flex-col gap-3">
        <h1>What would you like to do?</h1>
        <p className="text-text-secondary">Choose a flow to start. Use synthetic data only.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ICard clickable>
          <FileUp aria-hidden="true" className="size-8 text-brand" />
          <ICardHeading>
            <ICardLink>
              <Link to="/patient-upload">Patient document upload</Link>
            </ICardLink>
          </ICardHeading>
          <ICardBody>
            <p>Answer a few triage questions, upload your documents and get a confirmation.</p>
          </ICardBody>
          <ArrowRight aria-hidden="true" className="mt-auto size-6 text-action" />
        </ICard>

        <ICard clickable>
          <Settings aria-hidden="true" className="size-8 text-brand" />
          <ICardHeading>
            <ICardLink>
              <Link to="/admin/settings">Admin medical settings</Link>
            </ICardLink>
          </ICardHeading>
          <ICardBody>
            <p>Manage API providers, ingested forms and duplicates. Sign-in comes later.</p>
          </ICardBody>
          <ArrowRight aria-hidden="true" className="mt-auto size-6 text-action" />
        </ICard>
      </div>
    </IContainer>
  );
}
