import type { DocumentType } from '@ingest-form/shared';

import type { TemplateProfile } from '../page-words';
import carersIdentification from './carers-identification.profile.json';
import gms1 from './gms1.profile.json';
import newPatientAdult from './new-patient-adult.profile.json';
import newPatientChild from './new-patient-child.profile.json';
import travelRiskAssessment from './travel-risk-assessment.profile.json';

/*
 * Blank-form template profiles, built in the OCR lab from the blank PDFs in
 * HealthTech1-Research/Forms (`template_profile.py`). No patient data. JSON imports widen the
 * bbox tuples to number[], hence the assertion; the shapes were written by that one script.
 */
const PROFILES: Partial<Record<DocumentType, TemplateProfile>> = {
  gms1: gms1 as unknown as TemplateProfile,
  'new-patient-adult': newPatientAdult as unknown as TemplateProfile,
  'new-patient-child': newPatientChild as unknown as TemplateProfile,
  'carers-identification': carersIdentification as unknown as TemplateProfile,
  'travel-risk-assessment': travelRiskAssessment as unknown as TemplateProfile,
};

/** The blank form's profile for template mode, or undefined ("other" documents use discover mode). */
export function templateProfileFor(documentType: DocumentType): TemplateProfile | undefined {
  return PROFILES[documentType];
}
