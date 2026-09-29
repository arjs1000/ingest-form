/** The three numbered steps of the flow (the confirmation page is not a step). */
export const INTAKE_TOTAL_STEPS = 3;

export const PATIENT_GENDERS = ['male', 'female', 'other'] as const;

export const GENDER_LABELS: Record<(typeof PATIENT_GENDERS)[number], string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

/** Only UK addresses are accepted; the form shows it, the payload always sends it. */
export const PATIENT_COUNTRY = 'United Kingdom';

export const MAX_AGE_YEARS = 120;

export const INTAKE_ENDPOINT = '/api/v1/intake';
export const EXTRACT_ENDPOINT = '/api/v1/intake/extract';
export const UPLOAD_SETTINGS_ENDPOINT = '/api/v1/intake/settings';

/** Pipeline steps whose failure means the submission never really arrived: show the error screen. */
export const CRITICAL_FAILED_STEPS = ['validate'] as const;
