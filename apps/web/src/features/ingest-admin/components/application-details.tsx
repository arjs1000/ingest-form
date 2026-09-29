import type { ApplicationDto } from '@ingest-form/shared';

import { IFormSection } from '@/core/components/IFormSection';

// Display order and labels for the saved application. Internal ids are shown elsewhere.
const FIELDS: ReadonlyArray<{ key: keyof ApplicationDto; label: string }> = [
  { key: 'applicationReference', label: 'Application reference' },
  { key: 'sessionId', label: 'Session ID' },
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'email', label: 'Email' },
  { key: 'gender', label: 'Gender' },
  { key: 'dateOfBirth', label: 'Date of birth' },
  { key: 'mobileNumber', label: 'Mobile number' },
  { key: 'phoneNumber', label: 'Phone number' },
  { key: 'addressLine1', label: 'Address line 1' },
  { key: 'addressLine2', label: 'Address line 2' },
  { key: 'addressLine3', label: 'Address line 3' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'country', label: 'Country' },
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
  { key: 'id', label: 'Application ID' },
];

/** The transformed record the pipeline saved, as a key/value list. */
export function ApplicationDetails({ application }: { application: ApplicationDto }) {
  return (
    <IFormSection title="Transformed application" description="The record saved after the transform step.">
      <dl className="grid gap-x-6 gap-y-3 md:grid-cols-[12rem_minmax(0,1fr)]">
        {FIELDS.map(({ key, label }) => {
          const value = application[key];
          return (
            <div key={key} className="contents">
              <dt className="font-semibold">{label}</dt>
              <dd className="break-words">
                {value === null || value === '' ? <span className="text-text-secondary">Not provided</span> : String(value)}
              </dd>
            </div>
          );
        })}
      </dl>
    </IFormSection>
  );
}
